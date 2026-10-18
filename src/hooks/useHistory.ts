import { useState, useEffect, useCallback } from 'react'
import type { ScanRecord, ScanResult } from '../types'
import { getScanHistory, saveScanRecord, deleteScanRecord, clearScanHistory } from '../lib/storage'

export function useHistory() {
  const [records, setRecords] = useState<ScanRecord[]>([])

  useEffect(() => {
    getScanHistory().then(setRecords)
  }, [])

  const save = useCallback(async (result: ScanResult) => {
    setRecords(await saveScanRecord(result))
  }, [])

  const remove = useCallback(async (id: string) => {
    setRecords(await deleteScanRecord(id))
  }, [])

  const clear = useCallback(async () => {
    await clearScanHistory()
    setRecords([])
  }, [])

  return { records, save, remove, clear }
}
