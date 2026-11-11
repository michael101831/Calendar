import { useEffect, useRef, useState } from 'react'
import {
  createCloudProfile,
  deleteCloudProfile,
  renameCloudProfile,
  seedCloudFromLocal,
  subscribeProfiles,
} from '../lib/cloudCalendar'
import { loadProfileStore, removeProfileEvents, saveProfileStore } from '../utils/storage'

const MAX_NAME_LENGTH = 40

function cleanName(name) {
  return name.trim().slice(0, MAX_NAME_LENGTH)
}

function activeKey(uid) {
  return `daybook.active.${uid}`
}

function chooseActiveId(uid, profiles, preferred) {
  if (preferred && profiles.some((profile) => profile.id === preferred)) return preferred
  const stored = uid ? localStorage.getItem(activeKey(uid)) : null
  if (stored && profiles.some((profile) => profile.id === stored)) return stored
  return profiles[0]?.id ?? null
}

function rememberActive(uid, id) {
  if (!uid || !id) return
  localStorage.setItem(activeKey(uid), id)
}

function blankCloudSession(uid) {
  return {
    uid,
    ready: false,
    syncError: null,
    store: { activeId: null, profiles: [] },
  }
}

export function useProfiles(user) {
  const uid = user?.uid ?? null
  const [session, setSession] = useState(() => ({
    uid: null,
    ready: true,
    syncError: null,
    store: loadProfileStore(),
  }))
  const profileIds = useRef(null)
  const pendingId = useRef(null)

  if (uid !== session.uid) {
    setSession(uid ? blankCloudSession(uid) : {
      uid: null,
      ready: true,
      syncError: null,
      store: loadProfileStore(),
    })
  }

  useEffect(() => {
    if (session.uid) return
    const ids = session.store.profiles.map((profile) => profile.id)
    if (profileIds.current) {
      for (const id of profileIds.current) {
        if (!ids.includes(id)) removeProfileEvents(id)
      }
    }
    profileIds.current = ids
    saveProfileStore(session.store)
  }, [session])

  useEffect(() => {
    if (!uid) return undefined
    let unsubscribe = () => {}
    let cancelled = false
    let creatingDefault = false

    async function start() {
      try {
        await seedCloudFromLocal(uid)
      } catch (err) {
        console.error('Could not copy this browser’s calendars to the account.', err)
        if (!cancelled) {
          setSession((prev) =>
            prev.uid === uid
              ? { ...prev, syncError: 'Could not copy this browser’s calendars to the account.' }
              : prev,
          )
        }
      }
      if (cancelled) return

      unsubscribe = subscribeProfiles(
        uid,
        (profiles) => {
          if (profiles.length === 0 && !pendingId.current) {
            if (creatingDefault) return
            creatingDefault = true
            const profile = { id: crypto.randomUUID(), name: 'Personal' }
            pendingId.current = profile.id
            rememberActive(uid, profile.id)
            createCloudProfile(uid, profile).catch((err) => {
              console.error(err)
              pendingId.current = null
              if (!cancelled) {
                setSession((prev) =>
                  prev.uid === uid
                    ? {
                        ...prev,
                        ready: true,
                        syncError: 'Could not load the calendars on this account.',
                      }
                    : prev,
                )
              }
            })
            return
          }
          setSession((prev) => {
            if (prev.uid !== uid) return prev
            const pending = pendingId.current
            if (pending && profiles.some((profile) => profile.id === pending)) pendingId.current = null
            const waiting = Boolean(pendingId.current)
            const activeId = waiting
              ? pendingId.current
              : chooseActiveId(uid, profiles, prev.ready ? prev.store.activeId : null)
            if (!waiting && activeId) rememberActive(uid, activeId)
            return {
              uid,
              ready: true,
              syncError: null,
              store: {
                activeId,
                profiles: waiting && prev.store.profiles.length > 0 ? prev.store.profiles : profiles,
              },
            }
          })
        },
        (err) => {
          console.error(err)
          if (cancelled) return
          setSession((prev) =>
            prev.uid === uid
              ? { ...prev, ready: true, syncError: 'Could not load the calendars on this account.' }
              : prev,
          )
        },
      )
    }

    void start()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [uid])

  async function createProfile(name) {
    const trimmed = cleanName(name)
    if (!trimmed) return null
    const profile = { id: crypto.randomUUID(), name: trimmed, createdAt: Date.now() }
    if (!session.uid) {
      setSession((prev) => ({
        ...prev,
        store: { activeId: profile.id, profiles: [...prev.store.profiles, profile] },
      }))
      return profile
    }
    const previousId = session.store.activeId
    pendingId.current = profile.id
    rememberActive(session.uid, profile.id)
    setSession((prev) => ({
      ...prev,
      syncError: null,
      store: {
        activeId: profile.id,
        profiles: prev.store.profiles.some((item) => item.id === profile.id)
          ? prev.store.profiles
          : [...prev.store.profiles, profile],
      },
    }))
    try {
      await createCloudProfile(session.uid, profile)
      return profile
    } catch (err) {
      console.error(err)
      pendingId.current = null
      if (previousId) rememberActive(session.uid, previousId)
      setSession((prev) => ({
        ...prev,
        syncError: 'Could not add that profile.',
        store: {
          activeId: previousId,
          profiles: prev.store.profiles.filter((item) => item.id !== profile.id),
        },
      }))
      return null
    }
  }

  function selectProfile(id) {
    if (session.uid) rememberActive(session.uid, id)
    setSession((prev) => {
      if (!prev.store.profiles.some((profile) => profile.id === id)) return prev
      if (prev.store.activeId === id) return prev
      return { ...prev, store: { ...prev.store, activeId: id } }
    })
  }

  async function renameProfile(id, name) {
    const trimmed = cleanName(name)
    if (!trimmed) return false
    if (!session.uid) {
      setSession((prev) => ({
        ...prev,
        store: {
          ...prev.store,
          profiles: prev.store.profiles.map((profile) =>
            profile.id === id ? { ...profile, name: trimmed } : profile,
          ),
        },
      }))
      return true
    }
    try {
      await renameCloudProfile(session.uid, id, trimmed)
      setSession((prev) => ({
        ...prev,
        syncError: null,
        store: {
          ...prev.store,
          profiles: prev.store.profiles.map((profile) =>
            profile.id === id ? { ...profile, name: trimmed } : profile,
          ),
        },
      }))
      return true
    } catch (err) {
      console.error(err)
      setSession((prev) => ({ ...prev, syncError: 'Could not rename that profile.' }))
      return false
    }
  }

  async function deleteProfile(id) {
    if (session.store.profiles.length < 2) return false
    const profiles = session.store.profiles.filter((profile) => profile.id !== id)
    if (profiles.length === session.store.profiles.length) return false
    const activeId = session.store.activeId === id ? profiles[0].id : session.store.activeId
    if (!session.uid) {
      setSession((prev) => ({ ...prev, store: { activeId, profiles } }))
      return true
    }
    try {
      await deleteCloudProfile(session.uid, id)
      rememberActive(session.uid, activeId)
      setSession((prev) => ({
        ...prev,
        syncError: null,
        store: { activeId, profiles },
      }))
      return true
    } catch (err) {
      console.error(err)
      setSession((prev) => ({ ...prev, syncError: 'Could not delete that profile.' }))
      return false
    }
  }

  const activeProfile = session.ready
    ? session.store.profiles.find((profile) => profile.id === session.store.activeId) ??
      session.store.profiles[0] ??
      null
    : null

  return {
    profiles: session.ready ? session.store.profiles : [],
    activeProfile,
    ready: session.ready,
    syncError: session.syncError,
    createProfile,
    selectProfile,
    renameProfile,
    deleteProfile,
  }
}
