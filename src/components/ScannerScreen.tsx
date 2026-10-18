import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { prepareForUpload } from '../lib/image'
import { scanImage } from '../lib/api'
import { PUNCH, PAPER_COLOR, INK_COLOR, DANGER } from '../theme'

interface Props {
  onScanComplete: (detectedTitles: string[]) => void
}

const paperAlpha = (a: number) => `rgba(245, 245, 240, ${a})`

export function ScannerScreen({ onScanComplete }: Props) {
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraReady, setCameraReady] = useState(false)
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

  return (
    <View style={styles.root}>
      <View style={styles.viewfinder}>
        {granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            {permission && !permission.canAskAgain ? (
              <View style={styles.center}>
                <Text style={styles.bigLabel}>NO CAMERA</Text>
                <Text style={styles.subLabel}>Camera access is off. Enable it in Settings, or upload a photo below.</Text>
                <Pressable onPress={() => Linking.openSettings()} style={styles.settingsButton}>
                  <Text style={styles.settingsText}>OPEN SETTINGS</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.center}>
                <Pressable onPress={requestPermission} style={styles.startButton} accessibilityLabel="Start camera">
                  <Ionicons name="camera-outline" size={40} color={INK_COLOR} />
                </Pressable>
                <Text style={styles.hint}>TAP TO START CAMERA</Text>
              </View>
            )}
          </View>
        )}

        {granted && !scanning && (
          <View style={styles.guides} pointerEvents="none">
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />
          </View>
        )}

        {scanning && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={PUNCH} />
            <Text style={styles.analyzing}>ANALYZING</Text>
            <Text style={styles.hint}>READING TITLES</Text>
          </View>
        )}
      </View>

      {scanError && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{scanError}</Text>
          <Pressable onPress={() => setScanError(null)} hitSlop={12} accessibilityLabel="Dismiss error">
            <Text style={styles.errorClose}>×</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          onPress={handlePick}
          disabled={scanning}
          style={[styles.uploadButton, scanning && styles.disabled]}
          accessibilityLabel="Upload photo"
        >
          <Ionicons name="images-outline" size={22} color={PAPER_COLOR} />
        </Pressable>

        <Pressable
          onPress={handleCapture}
          disabled={!granted || !cameraReady || scanning}
          style={({ pressed }) => [
            styles.shutter,
            (!granted || !cameraReady || scanning) && styles.disabled,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          accessibilityLabel="Capture"
        />

        <View style={{ width: 48 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  viewfinder: { flex: 1, overflow: 'hidden' },
  placeholder: { flex: 1, backgroundColor: INK_COLOR, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 20, paddingHorizontal: 32 },
  startButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PAPER_COLOR,
    borderWidth: 2,
    borderColor: PAPER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '4px 4px 0px rgba(255,255,255,0.15)',
  },
  bigLabel: { color: PAPER_COLOR, fontWeight: '900', fontSize: 18 },
  subLabel: { color: paperAlpha(0.5), fontSize: 14, textAlign: 'center' },
  hint: { color: paperAlpha(0.4), fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  guides: { position: 'absolute', top: 32, left: 32, right: 32, bottom: 32 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: paperAlpha(0.7) },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzing: { color: PAPER_COLOR, fontWeight: '900', fontSize: 24, marginTop: 12 },
  error: {
    backgroundColor: DANGER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  errorClose: { color: '#fff', fontWeight: '900', fontSize: 22, lineHeight: 22 },
  controls: {
    backgroundColor: INK_COLOR,
    borderTopWidth: 2,
    borderTopColor: paperAlpha(0.1),
    paddingHorizontal: 32,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paperAlpha(0.1),
    borderWidth: 2,
    borderColor: paperAlpha(0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PAPER_COLOR,
    borderWidth: 2,
    borderColor: PAPER_COLOR,
    boxShadow: '0px 0px 0px 4px rgba(255,255,255,0.15)',
  },
  disabled: { opacity: 0.4 },
  settingsButton: { borderWidth: 2, borderColor: PAPER_COLOR, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  settingsText: { color: PAPER_COLOR, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
})
