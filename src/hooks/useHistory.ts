import { useState, useEffect, useCallback } from 'react'
import type { ScanRecord, ScanResult } from '../types'
import { getScanHistory, saveScanRecord, deleteScanRecord, clearScanHistory } from '../utils/storage'

export function useHistory() {
  const [records, setRecords] = useState<ScanRecord[]>([])

  useEffect(() => {
    getScanHistory().then(setRecords)
  }, [])

  const save = useCallback(async (result: ScanResult): Promise<ScanRecord> => {
    const record = await saveScanRecord(result)
    setRecords((prev) => [record, ...prev].slice(0, 50))
    return record
  }, [])

  const remove = useCallback(async (id: string) => {
    const updated = await deleteScanRecord(id)
    setRecords(updated)
  }, [])

  const clear = useCallback(async () => {
    await clearScanHistory()
    setRecords([])
  }, [])

  return { records, save, remove, clear }
}
