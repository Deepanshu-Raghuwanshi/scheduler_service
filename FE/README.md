# Job Scheduler Frontend Dashboard

A modern React-based dashboard for managing and monitoring scheduled jobs with real-time updates and intuitive user interface.

## 🏗️ Architecture

```
FE/frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard.jsx  # Main dashboard view
│   │   ├── JobList.jsx    # Job listing with filters
│   │   ├── JobForm.jsx    # Job creation/editing form
│   │   ├── JobDetail.jsx  # Individual job details
│   │   └── Layout.jsx     # App layout wrapper
│   ├── hooks/            # Custom React hooks
│   │   └── useJobs.js    # Job management hooks
│   ├── services/         # API service layer
│   │   └── jobService.js # Job API calls
│   ├── config/           # Configuration files
│   │   └── api.js        # API configuration
│   ├── assets/           # Images, icons, etc.
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── .env.example          # Environment variables template
```

## 🚀 Tech Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS 3.3.6
- **State Management**: React Query 3.39.3
- **Routing**: React Router DOM 6.26.2
- **Forms**: React Hook Form 7.53.0
- **HTTP Client**: Axios 1.7.7
- **Notifications**: React Toastify 10.0.5
- **Date Handling**: date-fns 2.30.0
- **Linting**: ESLint 9.29.0

## 📦 Dependencies

### Production Dependencies

```json
{
  "react": "^18.2.0", // Core React library
  "react-dom": "^18.2.0", // React DOM rendering
  "axios": "^1.7.7", // HTTP client for API calls
  "date-fns": "^2.30.0", // Date manipulation utilities
  "react-hook-form": "^7.53.0", // Form handling and validation
  "react-query": "^3.39.3", // Server state management
  "react-toastify": "^10.0.5", // Toast notifications
  "react-router-dom": "^6.26.2" // Client-side routing
}
```

### Development Dependencies

```json
{
  "@vitejs/plugin-react": "^4.5.2", // Vite React plugin
  "autoprefixer": "^10.4.16", // CSS autoprefixer
  "eslint": "^9.29.0", // JavaScript linting
  "postcss": "^8.4.32", // CSS processing
  "tailwindcss": "^3.3.6", // Utility-first CSS framework
  "vite": "^7.0.0" // Build tool and dev server
}
```

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Deepanshu-Raghuwanshi/scheduler_service.git
cd scheduler_service
```

### 2. Install Dependencies

```bash
cd FE/frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎨 Features

### 📊 Dashboard Overview

- **Job Statistics**: Total, active, and inactive job counts
- **Job Type Distribution**: Visual breakdown by job types
- **Recent Activity**: Latest job executions and status updates
- **Quick Actions**: Fast access to common operations

### 📋 Job Management

- **Job Listing**: Paginated table and grid views
- **Advanced Filtering**: Search by name, type, status, and tags
- **Bulk Operations**: Select multiple jobs for batch actions
- **Real-time Updates**: Live status updates without page refresh

### ✏️ Job Creation & Editing

- **Intuitive Form**: Step-by-step job creation wizard
- **Cron Expression Builder**: Visual cron expression editor
- **Validation**: Real-time form validation with helpful error messages
- **Payload Editor**: JSON payload editor with syntax highlighting

### 🔍 Job Details

- **Comprehensive View**: All job information in one place
- **Execution History**: Detailed execution logs and statistics
- **Performance Metrics**: Success rates, average duration, error analysis
- **Manual Controls**: Trigger, pause, resume, and delete operations

### 📱 Responsive Design

- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large touch targets and intuitive gestures
- **Progressive Enhancement**: Works on all modern browsers

## 🧩 Components

### Core Components

#### `Dashboard.jsx`

Main dashboard component displaying job statistics and overview.

**Features:**

- Job count summaries
- Job type distribution charts
- Recent activity feed
- Quick action buttons

#### `JobList.jsx`

Comprehensive job listing with filtering and bulk operations.

**Features:**

- Table and grid view modes
- Advanced filtering (search, type, status, tags)
- Pagination with customizable page sizes
- Bulk selection and operations
- Real-time status updates

**Props:**

```javascript
// No props - uses hooks for data management
```

#### `JobForm.jsx`

Form component for creating and editing jobs.

**Features:**

- Multi-step form wizard
- Real-time validation
- Cron expression builder
- JSON payload editor
- Auto-save drafts

**Props:**

```javascript
{
  job?: Job,           // Job to edit (optional for create mode)
  onSubmit: Function,  // Form submission handler
  onCancel: Function,  // Cancel handler
  isLoading?: boolean  // Loading state
}
```

#### `JobDetail.jsx`

Detailed view of individual jobs with execution history.

**Features:**

- Complete job information
- Execution history with filtering
- Performance metrics
- Manual job controls
- Real-time status updates

**Props:**

```javascript
{
  jobId: string; // Job ID to display
}
```

#### `Layout.jsx`

Main application layout wrapper.

**Features:**

- Navigation header
- Sidebar (if applicable)
- Toast notification container
- Loading states
- Error boundaries

### Utility Components

#### Status Badges

```javascript
const getStatusBadge = (isActive) => (
  <span className={`badge ${isActive ? "badge-success" : "badge-error"}`}>
    {isActive ? "Active" : "Inactive"}
  </span>
);
```

#### Job Type Badges

```javascript
const getJobTypeBadge = (jobType) => {
  const styles = {
    scheduled: "bg-blue-100 text-blue-800",
    immediate: "bg-orange-100 text-orange-800",
    recurring: "bg-purple-100 text-purple-800",
    delayed: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`badge ${styles[jobType]}`}>{jobType}</span>;
};
```

## 🎣 Custom Hooks

### `useJobs.js`

Main hook for job management with React Query integration.

```javascript
const {
  jobs, // Array of jobs
  pagination, // Pagination info
  isLoading, // Loading state
  isError, // Error state
  error, // Error object
  params, // Current query parameters
  updateParams, // Update query parameters
  resetToFirstPage, // Reset to first page
} = useJobs();
```

### `useJobMutations.js`

Hook for job mutation operations.

```javascript
const {
  deleteJob, // Delete job function
  triggerJob, // Trigger job function
  toggleJobStatus, // Toggle active status
  bulkOperation, // Bulk operations
  isDeleting, // Delete loading state
  isTriggering, // Trigger loading state
  isTogglingStatus, // Toggle loading state
  isBulkOperating, // Bulk operation loading state
} = useJobMutations();
```

## 🌐 API Integration

### Service Layer (`jobService.js`)

Centralized API communication layer using Axios.

```javascript
// Get all jobs with filtering
const getJobs = async (params) => {
  const response = await api.get("/jobs", { params });
  return response.data;
};

// Create new job
const createJob = async (jobData) => {
  const response = await api.post("/jobs", jobData);
  return response.data;
};

// Update existing job
const updateJob = async (id, jobData) => {
  const response = await api.put(`/jobs/${id}`, jobData);
  return response.data;
};

// Delete job
const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};

// Trigger job manually
const triggerJob = async (id) => {
  const response = await api.post(`/jobs/${id}/trigger`);
  return response.data;
};
```

### Error Handling

```javascript
// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "An error occurred";
    toast.error(message);
    return Promise.reject(error);
  }
);
```

## 🎨 Styling & Theming

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
```

### Component Styling Patterns

```javascript
// Button variants
const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
};

// Status colors
const statusColors = {
  active: "text-green-600 bg-green-100",
  inactive: "text-red-600 bg-red-100",
  running: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
  failed: "text-red-600 bg-red-100",
};
```

## 📱 Responsive Design

### Breakpoint Strategy

```css
/* Mobile First Approach */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

.grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.text-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}
```

### Mobile Optimizations

- Touch-friendly button sizes (min 44px)
- Simplified navigation for small screens
- Collapsible filters and advanced options
- Swipe gestures for table navigation
- Optimized form layouts for mobile input

## 🔄 State Management

### React Query Configuration

```javascript
// Query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Query Keys

```javascript
const queryKeys = {
  jobs: ["jobs"],
  jobsList: (params) => ["jobs", "list", params],
  job: (id) => ["jobs", "detail", id],
  jobStats: ["jobs", "stats"],
  jobExecutions: (id, params) => ["jobs", id, "executions", params],
};
```

## 🧪 Testing

### Component Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Utilities

```javascript
// Test utilities for components
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};
```

## 🚀 Build & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["react-query"],
          ui: ["react-hook-form", "react-toastify"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

## 🔧 Configuration

### Environment Variables

| Variable                           | Description                 | Default                   | Required |
| ---------------------------------- | --------------------------- | ------------------------- | -------- |
| `VITE_API_BASE_URL`                | Backend API base URL        | http://localhost:3000/api | ✅       |
| `VITE_NODE_ENV`                    | Environment mode            | development               | ❌       |
| `VITE_ENABLE_DEV_TOOLS`            | Enable development tools    | true                      | ❌       |
| `VITE_ENABLE_REACT_QUERY_DEVTOOLS` | Enable React Query devtools | true                      | ❌       |

### Feature Flags

```javascript
// Feature flag utilities
const isDevMode = import.meta.env.VITE_NODE_ENV === "development";
const enableDevTools = import.meta.env.VITE_ENABLE_DEV_TOOLS === "true";
const enableQueryDevtools =
  import.meta.env.VITE_ENABLE_REACT_QUERY_DEVTOOLS === "true";
```

## 🎯 Performance Optimizations

### Code Splitting

```javascript
// Lazy loading for routes
const Dashboard = lazy(() => import("./components/Dashboard"));
const JobList = lazy(() => import("./components/JobList"));
const JobDetail = lazy(() => import("./components/JobDetail"));
```

### Memoization

```javascript
// Memoized components for performance
const JobCard = memo(({ job, onSelect, onTrigger }) => {
  // Component implementation
});

// Memoized calculations
const jobStats = useMemo(() => {
  return jobs.reduce(
    (stats, job) => {
      stats.total++;
      stats[job.isActive ? "active" : "inactive"]++;
      return stats;
    },
    { total: 0, active: 0, inactive: 0 }
  );
}, [jobs]);
```

### Virtual Scrolling (for large lists)

```javascript
// Virtual scrolling for large job lists
import { FixedSizeList as List } from "react-window";

const VirtualJobList = ({ jobs }) => (
  <List height={600} itemCount={jobs.length} itemSize={80} itemData={jobs}>
    {JobRow}
  </List>
);
```

## 🐛 Debugging

### React Query Devtools

```javascript
// Enable in development
import { ReactQueryDevtools } from "react-query/devtools";

function App() {
  return (
    <>
      <Router>{/* App content */}</Router>
      {enableQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
```

### Error Boundaries

```javascript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 🤝 Contributing

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (if migrating)
- Write meaningful component and function names
- Add JSDoc comments for complex functions

### Component Guidelines

```javascript
// Component template
const ComponentName = ({ prop1, prop2, ...props }) => {
  // Hooks at the top
  const [state, setState] = useState(initialValue);
  const { data, isLoading } = useQuery(queryKey, queryFn);

  // Event handlers
  const handleEvent = useCallback(
    (event) => {
      // Handler implementation
    },
    [dependencies]
  );

  // Render helpers
  const renderHelper = () => {
    // Helper implementation
  };

  // Early returns for loading/error states
  if (isLoading) return <LoadingSpinner />;

  // Main render
  return <div className="component-container">{/* Component JSX */}</div>;
};

export default ComponentName;
```

## 📄 License

This project is licensed under the MIT License.
