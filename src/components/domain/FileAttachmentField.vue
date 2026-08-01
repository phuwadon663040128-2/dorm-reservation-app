<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileImageIcon, FileTextIcon, UploadIcon, XIcon } from '@lucide/vue'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { validateUploadFile } from '@/lib/validation'

const props = withDefaults(defineProps<{
  inputId: string
  label: string
  selectLabel: string
  hint: string
  accept: string
  kind?: 'image' | 'document'
  state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done'
  statusText?: string
  selectedHelp?: string
  disabled?: boolean
  maxSizeMb?: number
}>(), {
  kind: 'document',
  state: 'idle',
  statusText: 'พร้อมอัปโหลด',
  selectedHelp: 'กดที่รายการไฟล์เพื่อเลือกไฟล์ใหม่ หรือกดปุ่มกากบาทเพื่อนำไฟล์ออก',
  disabled: false,
  maxSizeMb: 10,
})

const fileName = defineModel<string>({ default: '' })
const selectedFile = defineModel<File | null>('file', { default: null })
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreviewUrl = ref('')
const fileError = ref('')

watch(
  selectedFile,
  (file, _previousFile, onCleanup) => {
    imagePreviewUrl.value = ''
    if (!file?.type.startsWith('image/')) return

    const objectUrl = URL.createObjectURL(file)
    imagePreviewUrl.value = objectUrl
    onCleanup(() => URL.revokeObjectURL(objectUrl))
  },
  { immediate: true },
)

watch(
  fileName,
  (name) => {
    if (!name || (selectedFile.value && selectedFile.value.name !== name)) {
      selectedFile.value = null
    }
  },
  { immediate: true },
)

const fileMetadata = computed(() => {
  const file = selectedFile.value
  const extension = (file?.name ?? fileName.value).split('.').pop()?.toUpperCase() || 'ไฟล์'
  const size = file ? ` · ${formatFileSize(file.size)}` : ''
  return `${extension}${size} · ${props.statusText}`
})

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) return

  const allowedMimeTypes = props.accept.split(',').map(item => item.trim()).filter(Boolean)
  const allowedExtensions = allowedMimeTypes.flatMap((type) => {
    if (type === 'image/jpeg') return ['jpg', 'jpeg']
    if (type === 'image/png') return ['png']
    if (type === 'application/pdf') return ['pdf']
    return []
  })
  const validationMessage = validateUploadFile(file, {
    maxSizeMb: props.maxSizeMb,
    allowedMimeTypes,
    allowedExtensions,
  })
  if (validationMessage) {
    fileError.value = validationMessage
    input.value = ''
    return
  }

  fileError.value = ''
  selectedFile.value = file
  fileName.value = file.name
}

function openFileDialog() {
  if (props.disabled || !fileInput.value) return
  fileError.value = ''
  fileInput.value.value = ''
  fileInput.value.click()
}

function removeFile() {
  if (props.disabled) return
  fileError.value = ''
  selectedFile.value = null
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <Field>
    <FieldLabel :for="inputId">{{ label }}</FieldLabel>
    <div class="space-y-2">
      <button
        v-if="!fileName"
        type="button"
        class="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click="openFileDialog"
      >
        <UploadIcon class="size-5 text-muted-foreground" aria-hidden="true" />
        <span class="text-sm font-medium">{{ selectLabel }}</span>
        <span class="text-xs text-muted-foreground">{{ hint }} · ไม่เกิน {{ maxSizeMb }} MB</span>
      </button>

      <Attachment v-else :state="state" size="sm" class="w-full flex-nowrap">
        <AttachmentMedia
          :variant="imagePreviewUrl ? 'image' : 'icon'"
          :class="imagePreviewUrl ? 'size-12! p-0' : undefined"
        >
          <img
            v-if="imagePreviewUrl"
            :src="imagePreviewUrl"
            :alt="`ตัวอย่างไฟล์ ${fileName}`"
            width="128"
            height="128"
            decoding="async"
            class="size-full object-cover"
          >
          <FileImageIcon v-else-if="kind === 'image'" aria-hidden="true" />
          <FileTextIcon v-else aria-hidden="true" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{{ fileName }}</AttachmentTitle>
          <AttachmentDescription>{{ fileMetadata }}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions v-if="!disabled">
          <AttachmentAction
            type="button"
            :aria-label="`ลบไฟล์ ${fileName}`"
            @click.stop="removeFile"
          >
            <XIcon aria-hidden="true" />
          </AttachmentAction>
        </AttachmentActions>
        <AttachmentTrigger
          v-if="!disabled"
          type="button"
          :aria-label="`เปลี่ยนไฟล์ ${fileName}`"
          @click="openFileDialog"
        />
      </Attachment>

      <FieldDescription v-if="fileName">{{ selectedHelp }}</FieldDescription>
      <FieldError :errors="[fileError]" />

      <input
        :id="inputId"
        ref="fileInput"
        type="file"
        :accept="accept"
        :disabled="disabled"
        class="sr-only"
        @change="selectFile"
      >
    </div>
  </Field>
</template>
