import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { prepareForUpload } from '../lib/image'
import { scanImage } from '../lib/api'
import { useTheme } from '../theme'
import { IconButton, LargeTitle } from './ui'

interface Props {
  wantedCount: number
  onScanComplete: (detectedTitles: string[]) => void
}

export function ScannerScreen({ wantedCount, onScanComplete }: Props) {
  const c = useTheme()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraReady, setCameraReady] = useState(false)
  const [flash, setFlash] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  async function scan(uri: string, width: number, height: number) {
    setScanning(true)
    setScanError(null)
    try {
      const prepared = await prepareForUpload(uri, width, height)
      onScanComplete(await scanImage(prepared))
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleCapture() {
    if (!cameraRef.current || scanning) return
    // Fire before the capture so the tap is acknowledged instantly; never let it block the photo
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, shutterSound: false })
      await scan(photo.uri, photo.width, photo.height)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Could not take photo')
    }
  }

  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    await scan(asset.uri, asset.width, asset.height)
  }

  const granted = permission?.granted ?? false
  const canCapture = granted && cameraReady && !scanning

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <LargeTitle
        title="Scan"
        subtitle={
          wantedCount > 0 ? (
            <Text>
              Checking against <Text style={{ color: c.text, fontWeight: '600' }}>{wantedCount} wanted title{wantedCount === 1 ? '' : 's'}</Text>
            </Text>
          ) : (
            'Add titles on the Wanted tab to find matches'
          )
        }
      />

      <View style={[styles.camera, { backgroundColor: c.camera }]}>
        {granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              flash={flash ? 'on' : 'off'}
              onCameraReady={() => setCameraReady(true)}
            />
            {!scanning && (
              <>
                <View style={styles.hintWrap} pointerEvents="none">
                  <Text style={styles.hint}>Fit one shelf in the frame</Text>
                </View>
                <View style={styles.frame} pointerEvents="none" />
              </>
            )}
          </>
        ) : (
          <View style={styles.permission}>
            <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.85)" />
            {permission && !permission.canAskAgain ? (
              <>
                <Text style={styles.permissionTitle}>Camera access is off</Text>
                <Text style={styles.permissionBody}>Turn it on in Settings, or choose a photo instead.</Text>
                <Pressable onPress={() => Linking.openSettings()} style={styles.permissionButton} accessibilityRole="button">
                  <Text style={styles.permissionButtonText}>Open Settings</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.permissionTitle}>Point your camera at a shelf</Text>
                <Text style={styles.permissionBody}>Shelf Scanner reads the titles on the spines.</Text>
                <Pressable onPress={requestPermission} style={styles.permissionButton} accessibilityRole="button">
                  <Text style={styles.permissionButtonText}>Turn on camera</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {scanning && (
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <ActivityIndicator color="#111827" />
              <Text style={styles.overlayText}>Reading titles…</Text>
            </View>
          </View>
        )}
      </View>

      {scanError && (
        <View style={[styles.error, { backgroundColor: c.dangerTint }]}>
          <Ionicons name="alert-circle" size={20} color={c.danger} />
          <Text style={[styles.errorText, { color: c.danger }]}>{scanError}</Text>
          <Pressable onPress={() => setScanError(null)} hitSlop={12} accessibilityLabel="Dismiss error">
            <Ionicons name="close" size={20} color={c.danger} />
          </Pressable>
        </View>
      )}

      <View style={styles.controls}>
        <IconButton icon="images-outline" label="Choose from photos" onPress={handlePick} disabled={scanning} />
        <Pressable
          onPress={handleCapture}
          disabled={!canCapture}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={({ pressed }) => [
            styles.shutter,
            { borderColor: c.text, backgroundColor: c.card, opacity: canCapture ? 1 : 0.4 },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <View style={[styles.shutterInner, { backgroundColor: c.text }]} />
        </Pressable>
        <IconButton
          icon={flash ? 'flash' : 'flash-outline'}
          label={flash ? 'Turn off flash' : 'Turn on flash'}
          onPress={() => setFlash((f) => !f)}
          disabled={!granted}
          active={flash}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  camera: { flex: 1, marginHorizontal: 16, borderRadius: 28, overflow: 'hidden' },
  hintWrap: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    top: 64,
    left: 22,
    right: 22,
    bottom: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
  },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  permissionTitle: { color: '#ffffff', fontSize: 17, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  permissionBody: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' },
  permissionButton: { marginTop: 10, backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 20, height: 44, justifyContent: 'center' },
  permissionButtonText: { color: '#111827', fontSize: 15, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  overlayText: { color: '#111827', fontSize: 15, fontWeight: '600' },
  error: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, fontSize: 14, fontWeight: '500' },
  controls: { paddingHorizontal: 40, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31 },
})
