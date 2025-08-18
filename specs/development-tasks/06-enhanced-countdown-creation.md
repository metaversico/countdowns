# Enhanced Countdown Creation RFC

## Objective
Enhance the countdown creation experience with improved validation, richer content options, preview functionality, and social media optimization to create viral, shareable countdowns.

## User Stories
- As a content creator, I want rich customization options to make my countdown stand out
- As a social media user, I want optimized sharing with previews and metadata
- As a mobile user, I want a smooth creation experience on my device
- As a first-time user, I want guidance and examples to create engaging countdowns

## Enhanced Features

### Rich Content Support
- **Media Upload**: Images, GIFs, videos for countdown backgrounds
- **Custom Colors**: Brand colors and gradients
- **Typography**: Font selection and text styling
- **Emojis**: Native emoji picker integration
- **Call-to-Action**: Customizable action buttons with links

### Advanced Timing Options
- **Multiple Formats**: Date/time picker, duration selector, or text input
- **Timezone Support**: Automatic timezone detection and conversion
- **Recurring Events**: Daily, weekly, monthly, or custom patterns
- **Milestone Tracking**: Multiple countdown targets within one event

### Social Optimization
- **Auto-generated Previews**: Open Graph and Twitter Card images
- **Social Templates**: Pre-designed layouts for different platforms
- **Hashtag Suggestions**: Relevant hashtags based on content
- **Platform-specific Sizing**: Optimized dimensions for each platform

## UI/UX Design

### Creation Flow
```
Step 1: Basic Info
├── Title (required)
├── Description (optional)
└── Category selection

Step 2: Timing
├── End date/time picker
├── Timezone selector
└── Duration presets (1 hour, 1 day, 1 week, custom)

Step 3: Appearance
├── Background (color, image, gradient)
├── Text styling (font, color, size)
├── Layout template selection
└── Live preview

Step 4: Social & Sharing
├── Call-to-action setup
├── Social media optimization
├── Hashtag suggestions
└── Preview generation

Step 5: Review & Create
├── Final preview
├── Terms acceptance
└── Creation confirmation
```

### Form Components

#### Enhanced Title Input
```typescript
interface TitleInput {
  value: string;
  placeholder: string;
  maxLength: 100;
  validation: {
    required: true;
    minLength: 3;
    profanityFilter: boolean;
  };
  suggestions: string[]; // AI-generated suggestions
  characterCount: boolean;
}
```

#### Rich Description Editor
```typescript
interface DescriptionEditor {
  value: string;
  maxLength: 500;
  features: {
    emoji: boolean;
    mentions: boolean;
    hashtags: boolean;
    links: boolean;
  };
  formatting: {
    bold: boolean;
    italic: boolean;
    lineBreaks: boolean;
  };
}
```

#### Advanced Date/Time Picker
```typescript
interface DateTimePicker {
  mode: 'date' | 'duration' | 'text';
  timezone: string;
  formats: {
    date: string;
    time: string;
    display: string;
  };
  presets: Array<{
    label: string;
    duration: number; // milliseconds
  }>;
  validation: {
    minDate?: Date;
    maxDate?: Date;
    businessHours?: boolean;
  };
}
```

### Visual Customization

#### Background Options
```typescript
interface BackgroundOptions {
  type: 'color' | 'gradient' | 'image' | 'video';
  
  color?: {
    value: string;
    opacity: number;
  };
  
  gradient?: {
    colors: string[];
    direction: number; // degrees
    type: 'linear' | 'radial';
  };
  
  image?: {
    url: string;
    position: 'center' | 'top' | 'bottom';
    size: 'cover' | 'contain' | 'original';
    overlay?: {
      color: string;
      opacity: number;
    };
  };
  
  video?: {
    url: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
  };
}
```

#### Typography Settings
```typescript
interface TypographySettings {
  title: {
    font: string;
    size: number;
    weight: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
    shadow?: TextShadow;
  };
  
  description: {
    font: string;
    size: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
  
  countdown: {
    font: string;
    size: number;
    color: string;
    format: 'digital' | 'analog' | 'text';
  };
}
```

## Implementation Plan

### Backend Enhancements

#### Extended Countdown Model
```typescript
interface EnhancedCountdown extends BaseCountdown {
  // Content
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  
  // Media
  backgroundImage?: string;
  backgroundVideo?: string;
  socialImage?: string; // Auto-generated preview
  
  // Styling
  theme: {
    background: BackgroundOptions;
    typography: TypographySettings;
    layout: string; // template name
  };
  
  // Social
  callToAction?: {
    text: string;
    url: string;
    enabled: boolean;
  };
  
  socialMeta: {
    title: string;
    description: string;
    hashtags: string[];
    optimizedImages: {
      facebook: string;
      twitter: string;
      instagram: string;
    };
  };
  
  // Settings
  settings: {
    timezone: string;
    isPublic: boolean;
    allowComments: boolean;
    enableAnalytics: boolean;
  };
  
  // Metadata
  createdBy?: string; // IP or user ID
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Media Upload Service
```typescript
// backend/services/mediaService.ts
export class MediaService {
  async uploadImage(file: File, type: 'background' | 'social'): Promise<string> {
    // Validate file type and size
    await this.validateImage(file);
    
    // Process and optimize image
    const processedImage = await this.processImage(file, type);
    
    // Store in KV or external storage
    const url = await this.storeImage(processedImage);
    
    return url;
  }
  
  async generateSocialPreview(countdown: EnhancedCountdown): Promise<string> {
    // Generate Open Graph image using canvas or external service
    const canvas = this.createPreviewCanvas(countdown);
    const imageBuffer = await this.renderCanvas(canvas);
    
    return this.storeImage(imageBuffer, 'social-preview');
  }
  
  private async validateImage(file: File): Promise<void> {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      throw new Error('Image too large (max 5MB)');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported image format');
    }
  }
  
  private async processImage(file: File, type: string): Promise<Uint8Array> {
    // Resize and optimize based on type
    const targetSize = type === 'background' ? { width: 1200, height: 630 } : { width: 800, height: 418 };
    
    // Use image processing library (e.g., imagescript or external API)
    return this.resizeImage(file, targetSize);
  }
}
```

### Frontend Implementation

#### Enhanced Creation Form
```typescript
// frontend/src/components/CountdownCreator.vue
<template>
  <div class="countdown-creator">
    <div class="creator-steps">
      <StepIndicator :current-step="currentStep" :total-steps="5" />
    </div>
    
    <div class="creator-content">
      <Transition name="step" mode="out-in">
        <BasicInfoStep 
          v-if="currentStep === 1"
          v-model="formData.basic"
          @next="nextStep"
        />
        
        <TimingStep 
          v-else-if="currentStep === 2"
          v-model="formData.timing"
          @next="nextStep"
          @back="previousStep"
        />
        
        <AppearanceStep 
          v-else-if="currentStep === 3"
          v-model="formData.appearance"
          @next="nextStep"
          @back="previousStep"
        />
        
        <SocialStep 
          v-else-if="currentStep === 4"
          v-model="formData.social"
          @next="nextStep"
          @back="previousStep"
        />
        
        <ReviewStep 
          v-else-if="currentStep === 5"
          :form-data="formData"
          @create="createCountdown"
          @back="previousStep"
        />
      </Transition>
    </div>
    
    <div class="creator-preview">
      <CountdownPreview 
        :countdown="previewCountdown"
        :updating="previewUpdating"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface CreationFormData {
  basic: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  };
  timing: {
    endDate: Date;
    timezone: string;
    duration?: number;
  };
  appearance: {
    background: BackgroundOptions;
    typography: TypographySettings;
    layout: string;
  };
  social: {
    callToAction: CallToActionSettings;
    hashtags: string[];
    optimizeForPlatforms: string[];
  };
}

const currentStep = ref(1);
const formData = reactive<CreationFormData>({
  basic: { title: '', description: '', category: '', tags: [] },
  timing: { endDate: new Date(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  appearance: { background: { type: 'color', color: { value: '#6366f1', opacity: 1 } }, typography: defaultTypography, layout: 'modern' },
  social: { callToAction: { text: '', url: '', enabled: false }, hashtags: [], optimizeForPlatforms: ['twitter', 'facebook'] }
});

// Real-time preview
const previewCountdown = computed(() => ({
  ...formData.basic,
  ...formData.timing,
  theme: formData.appearance,
  socialMeta: {
    title: formData.basic.title,
    description: formData.basic.description,
    hashtags: formData.social.hashtags
  },
  callToAction: formData.social.callToAction,
  status: 'active' as const,
  timeRemaining: Math.max(0, formData.timing.endDate.getTime() - Date.now())
}));

const previewUpdating = ref(false);

// Watch for changes and update preview
watchDebounced(
  formData,
  async () => {
    previewUpdating.value = true;
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    previewUpdating.value = false;
  },
  { debounce: 500, deep: true }
);
</script>
```

#### Advanced Form Components

##### Media Upload Component
```typescript
// frontend/src/components/MediaUpload.vue
<template>
  <div class="media-upload">
    <div 
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        :accept="acceptedTypes"
        @change="handleFileSelect"
        hidden
      />
      
      <div v-if="!currentMedia && !isUploading" class="upload-prompt">
        <UploadIcon class="upload-icon" />
        <p>Drag & drop an image or click to browse</p>
        <small>Supports JPEG, PNG, WebP, GIF up to 5MB</small>
      </div>
      
      <div v-else-if="isUploading" class="upload-progress">
        <Spinner />
        <p>Processing image...</p>
        <ProgressBar :value="uploadProgress" />
      </div>
      
      <div v-else class="media-preview">
        <img :src="currentMedia" :alt="alt" />
        <div class="media-actions">
          <button @click.stop="removeMedia" class="remove-btn">
            <TrashIcon />
          </button>
          <button @click.stop="triggerFileInput" class="replace-btn">
            <EditIcon />
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  type: 'background' | 'social';
  acceptedTypes?: string;
  maxSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  acceptedTypes: 'image/jpeg,image/png,image/webp,image/gif',
  maxSize: 5 * 1024 * 1024 // 5MB
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  'upload-start': [];
  'upload-complete': [url: string];
  'upload-error': [error: string];
}>();

const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const error = ref('');
const currentMedia = toRef(props, 'modelValue');

const mediaService = new MediaService();

async function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && files[0]) {
    await uploadFile(files[0]);
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files[0]) {
    await uploadFile(files[0]);
  }
}

async function uploadFile(file: File) {
  error.value = '';
  isUploading.value = true;
  uploadProgress.value = 0;
  
  emit('upload-start');
  
  try {
    // Validate file
    await validateFile(file);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      uploadProgress.value = Math.min(uploadProgress.value + 10, 90);
    }, 100);
    
    // Upload file
    const url = await mediaService.uploadImage(file, props.type);
    
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    emit('update:modelValue', url);
    emit('upload-complete', url);
    
  } catch (err) {
    error.value = err.message;
    emit('upload-error', err.message);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

async function validateFile(file: File): Promise<void> {
  if (file.size > props.maxSize) {
    throw new Error(`File too large. Maximum size is ${formatFileSize(props.maxSize)}`);
  }
  
  const allowedTypes = props.acceptedTypes.split(',');
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file format');
  }
}
</script>
```

### Validation & Error Handling

#### Form Validation System
```typescript
// frontend/src/composables/useFormValidation.ts
interface ValidationRule<T = any> {
  validator: (value: T) => boolean | string;
  message?: string;
  trigger?: 'blur' | 'change' | 'submit';
}

interface FieldValidation {
  rules: ValidationRule[];
  error?: string;
  touched: boolean;
  valid: boolean;
}

export function useFormValidation<T extends Record<string, any>>(schema: ValidationSchema<T>) {
  const fields = reactive<Record<keyof T, FieldValidation>>({});
  const isValid = computed(() => Object.values(fields).every(field => field.valid));
  
  // Initialize field validations
  Object.keys(schema).forEach(key => {
    fields[key] = {
      rules: schema[key],
      touched: false,
      valid: false
    };
  });
  
  function validateField(fieldName: keyof T, value: any): boolean {
    const field = fields[fieldName];
    if (!field) return true;
    
    field.touched = true;
    field.error = undefined;
    
    for (const rule of field.rules) {
      const result = rule.validator(value);
      if (result !== true) {
        field.error = typeof result === 'string' ? result : rule.message;
        field.valid = false;
        return false;
      }
    }
    
    field.valid = true;
    return true;
  }
  
  function validateAll(data: T): boolean {
    let allValid = true;
    
    Object.keys(schema).forEach(key => {
      const isFieldValid = validateField(key, data[key]);
      if (!isFieldValid) allValid = false;
    });
    
    return allValid;
  }
  
  return {
    fields: readonly(fields),
    isValid,
    validateField,
    validateAll
  };
}

// Validation rules for countdown creation
export const countdownValidationSchema = {
  title: [
    {
      validator: (value: string) => value.length >= 3,
      message: 'Title must be at least 3 characters'
    },
    {
      validator: (value: string) => value.length <= 100,
      message: 'Title must be less than 100 characters'
    },
    {
      validator: (value: string) => !containsProfanity(value),
      message: 'Title contains inappropriate content'
    }
  ],
  
  description: [
    {
      validator: (value: string) => !value || value.length <= 500,
      message: 'Description must be less than 500 characters'
    }
  ],
  
  endDate: [
    {
      validator: (value: Date) => value > new Date(),
      message: 'End date must be in the future'
    },
    {
      validator: (value: Date) => value < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      message: 'End date cannot be more than 1 year in the future'
    }
  ]
};
```

## Performance Optimizations

### Image Processing
- **Client-side Resizing**: Resize images before upload to reduce bandwidth
- **Progressive Loading**: Show low-quality placeholder while high-quality loads
- **Format Optimization**: Auto-convert to WebP with fallbacks
- **CDN Integration**: Serve images from CDN with optimization

### Preview Generation
- **Debounced Updates**: Limit preview updates during rapid form changes
- **Canvas Caching**: Cache rendered preview elements
- **Worker Processing**: Use Web Workers for heavy preview computations
- **Incremental Updates**: Update only changed preview elements

### Form Performance
- **Virtual Scrolling**: For long lists (categories, templates)
- **Lazy Loading**: Load form sections on demand
- **Local Storage**: Save draft progress automatically
- **Optimistic Updates**: Show immediate feedback before server confirmation

## Testing Strategy

### Unit Tests
- **Validation Logic**: All form validation rules
- **Media Processing**: Image upload and optimization
- **Preview Generation**: Countdown preview rendering
- **Form State Management**: Multi-step form navigation

### Integration Tests
- **End-to-End Creation Flow**: Complete countdown creation process
- **Media Upload Pipeline**: File upload to storage
- **Preview Accuracy**: Generated previews match actual countdowns
- **Social Optimization**: Metadata generation and validation

### User Experience Tests
- **Accessibility**: Screen reader compatibility, keyboard navigation
- **Performance**: Form responsiveness under load
- **Mobile Experience**: Touch interactions and responsive design
- **Error Scenarios**: Network failures, invalid inputs

## Acceptance Criteria

### Core Functionality
- [ ] Multi-step creation form with validation
- [ ] Rich media upload (images, videos)
- [ ] Real-time preview generation
- [ ] Social media optimization
- [ ] Mobile-responsive design
- [ ] Form state persistence (drafts)

### Enhanced Features
- [ ] Advanced styling options (fonts, colors, layouts)
- [ ] Timezone support and conversion
- [ ] Call-to-action configuration
- [ ] Auto-generated social previews
- [ ] Accessibility compliance (WCAG 2.1 AA)

### Performance Requirements
- [ ] Form load time < 2 seconds
- [ ] Image upload progress indication
- [ ] Real-time preview updates < 300ms
- [ ] Mobile performance optimization
- [ ] Offline draft saving capability

## Future Enhancements

### AI-Powered Features
- **Smart Suggestions**: AI-generated titles and descriptions
- **Auto-Categorization**: Automatic category detection
- **Optimal Timing**: AI-suggested optimal countdown durations
- **Content Optimization**: AI-powered content improvements

### Advanced Customization
- **Custom Animations**: Animated countdown effects
- **Video Backgrounds**: Full video background support
- **Interactive Elements**: Polls, quizzes within countdowns
- **Brand Templates**: Custom templates for businesses

### Collaboration Features
- **Team Creation**: Multiple users editing countdowns
- **Approval Workflows**: Review and approval processes
- **Template Sharing**: Community template marketplace
- **Version History**: Track and revert countdown changes