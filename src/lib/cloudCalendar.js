import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { loadEvents, loadProfileStore } from '../utils/storage'

const BATCH_LIMIT = 400

function profileCollection(uid) {
  return collection(db, 'users', uid, 'profiles')
}

function profileRef(uid, profileId) {
  return doc(db, 'users', uid, 'profiles', profileId)
}

function eventCollection(uid, profileId) {
  return collection(db, 'users', uid, 'profiles', profileId, 'events')
}

function eventRef(uid, profileId, eventId) {
  return doc(db, 'users', uid, 'profiles', profileId, 'events', eventId)
}

function plain(value) {
  return JSON.parse(JSON.stringify(value))
}

async function commitAll(ops) {
  for (let index = 0; index < ops.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const op of ops.slice(index, index + BATCH_LIMIT)) {
      if (op.type === 'set') batch.set(op.ref, op.data)
      else batch.delete(op.ref)
    }
    await batch.commit()
  }
}

export async function seedCloudFromLocal(uid) {
  const existing = await getDocs(profileCollection(uid))
  if (!existing.empty) return

  const local = loadProfileStore()
  const ops = []
  local.profiles.forEach((profile, index) => {
    ops.push({
      type: 'set',
      ref: profileRef(uid, profile.id),
      data: { name: profile.name, createdAt: Date.now() + index },
    })
    for (const event of loadEvents(profile.id)) {
      if (!event?.id) continue
      ops.push({
        type: 'set',
        ref: eventRef(uid, profile.id, event.id),
        data: plain(event),
      })
    }
  })

  if (ops.length === 0) {
    const id = crypto.randomUUID()
    ops.push({
      type: 'set',
      ref: profileRef(uid, id),
      data: { name: 'Personal', createdAt: Date.now() },
    })
  }

  await commitAll(ops)
}

export function subscribeProfiles(uid, onProfiles, onError) {
  return onSnapshot(
    profileCollection(uid),
    (snapshot) => {
      const profiles = snapshot.docs
        .map((item) => {
          const data = item.data()
          const name = typeof data.name === 'string' ? data.name.trim() : ''
          return {
            id: item.id,
            name: name || 'Personal',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
          }
        })
        .sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name))
      onProfiles(profiles)
    },
    onError,
  )
}

export function createCloudProfile(uid, profile) {
  return setDoc(profileRef(uid, profile.id), {
    name: profile.name,
    createdAt: Date.now(),
  })
}

export function renameCloudProfile(uid, profileId, name) {
  return updateDoc(profileRef(uid, profileId), { name })
}

export async function deleteCloudProfile(uid, profileId) {
  const events = await getDocs(eventCollection(uid, profileId))
  const ops = events.docs.map((item) => ({ type: 'delete', ref: item.ref }))
  await commitAll(ops)
  await deleteDoc(profileRef(uid, profileId))
}

export function subscribeEvents(uid, profileId, onEvents, onError) {
  return onSnapshot(
    eventCollection(uid, profileId),
    (snapshot) => {
      onEvents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })))
    },
    onError,
  )
}

export function saveCloudEvent(uid, profileId, event) {
  return setDoc(eventRef(uid, profileId, event.id), plain(event))
}

export function updateCloudEvent(uid, profileId, eventId, updates) {
  return updateDoc(eventRef(uid, profileId, eventId), plain(updates))
}

export function deleteCloudEvent(uid, profileId, eventId) {
  return deleteDoc(eventRef(uid, profileId, eventId))
}
