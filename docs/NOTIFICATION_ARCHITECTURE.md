# Notification Architecture

This document describes the complete structure of the notification system, covering both backend and frontend files.

## Overview

The notification system uses two delivery mechanisms:

1. **Real-time delivery** – Socket.IO pushes a `notification:new` event directly to the connected user's browser as soon as an action occurs in the backend.
2. **Persisted delivery** – Each notification is saved to the `Notifications` database table so users can retrieve their notification history on page load even when they were offline.

---

## Backend Files

### 1. `backend/src/model/notification.js`

Sequelize model for the `Notifications` table.

| Field        | Type         | Description                                         |
|--------------|--------------|-----------------------------------------------------|
| `id`         | INTEGER PK   | Auto-increment primary key                          |
| `user_id`    | INTEGER      | Target user who receives the notification           |
| `type`       | ENUM         | Notification category (see types below)             |
| `message`    | TEXT         | Human-readable notification message                 |
| `readAt`     | DATE         | Timestamp when the user marked it as read (nullable)|
| `data`       | JSON         | Optional extra payload (e.g., contract ID, status)  |
| `contract_id`| INTEGER      | Reference to the related contract (nullable)        |
| `createdAt`  | TIMESTAMP    | Automatically set by Sequelize                      |

**Notification types (ENUM):**

| Type                    | When it is used                                           |
|-------------------------|-----------------------------------------------------------|
| `contract_created`      | A new teaching or advisor contract is created             |
| `contract_signed`       | A contract is signed by the lecturer or advisor           |
| `contract_request_redo` | Management requests a contract revision                   |
| `status_change`         | Any other contract status transition                      |
| `course_assigned`       | A lecturer's course assignments are updated by an admin   |

---

### 2. `backend/src/socket/notification.socket.js`

`NotificationSocketService` class wrapping Socket.IO. Instantiated once on server start.

**Methods:**

| Method                  | Purpose                                                                     |
|-------------------------|-----------------------------------------------------------------------------|
| `register()`            | Listens for client `join` events and places the socket in per-user and per-role rooms |
| `notifyLecturer()`      | Creates one Notification row and emits to `user:<id>` room                  |
| `notifyLecturers()`     | Bulk-creates Notification rows (in a transaction) and emits to each user room |
| `contractStatusChanged()`| Convenience wrapper around `notifyLecturer` for contract status events     |
| `notifyRole()`          | Looks up all active users with the given role, bulk-creates rows and emits per-user; falls back to `broadcastToRole` when no persisted users are found |
| `broadcastToRole()`     | Emits directly to the `role:<name>` Socket.IO room without persisting       |

**Socket rooms used:**

| Room name       | Joined by                                      |
|-----------------|------------------------------------------------|
| `user:<id>`     | The authenticated user upon connecting         |
| `role:admin`    | Users whose role is `admin`                    |
| `role:management` | Users whose role is `management`             |
| `role:lecturer` | Users whose role is `lecturer`                 |
| `role:advisor`  | Users whose role is `advisor`                  |

---

### 3. `backend/src/socket/index.js`

Initialises the Socket.IO `Server` and the `NotificationSocketService`.

```js
initSocket(httpServer)      // called once in server bootstrap
getNotificationSocket()     // returns the singleton service for use in controllers
```

---

### 4. `backend/src/controller/notification.controller.js`

REST handler for `GET /api/notifications`.

- **Lecturer / Advisor** – Returns the user's persisted `Notification` rows, supplemented by derived entries from pending `AdvisorContract` records not yet covered by a persisted row.
- **Admin / Management** – Returns the user's persisted rows, supplemented by derived entries from currently-pending `TeachingContract` and `AdvisorContract` records.
- Responses are sorted by `createdAt` descending and capped at 30 items.

---

### 5. `backend/src/route/notification.route.js`

```
GET /api/notifications   →  protect middleware  →  getMyNotifications
```

All routes are protected; a valid JWT session is required.

---

### 6. Controllers that trigger notifications

Notifications are sent after successful business operations by calling `getNotificationSocket()`:

| Controller / Action                           | Notification sent to                 | Type            |
|-----------------------------------------------|--------------------------------------|-----------------|
| `teachingContract` – create draft             | Lecturer (contract recipient)        | `status_change` |
| `teachingContract` – create draft             | `management` role                    | `status_change` |
| `teachingContract` – create draft             | `admin` role                         | `status_change` |
| `teachingContract` – sign / complete          | Lecturer                             | `status_change` |
| `teachingContract` – sign / complete          | `admin` and `management` roles       | `status_change` |
| `advisorContract` – create                    | Advisor (lecturer)                   | `status_change` |
| `advisorContract` – create                    | `management` and `admin` roles       | `status_change` |
| `advisorContract` – upload signature / complete | Advisor and `admin` role           | `status_change` |
| `advisorContract` – update status             | Advisor / `management` / `admin`     | `status_change` |
| `lecturer` – update courses                   | Lecturer (the updated lecturer)      | `course_assigned` |

---

## Frontend Files

### 1. `frontend/src/services/socket.js`

Creates and memoises a single Socket.IO client instance.

```js
getSocket()   // returns the singleton; connects lazily via autoConnect: false
```

The socket is pointed at the backend server root (derived from `VITE_API_URL`).

---

### 2. `frontend/src/services/contract.service.js` – `fetchMyNotifications`

```js
fetchMyNotifications()   // GET /api/notifications
```

Returns the array of notification objects for the logged-in user.

---

### 3. `frontend/src/hooks/useNotifications.js`

Used by **Management** role dashboards.

- On mount, calls `fetchMyNotifications()` and computes unread count from `localStorage` key `mgmtNotifLastSeenTs`.
- Subscribes to `notification:new` Socket.IO events.
- Marks all notifications read (persists max timestamp to `localStorage`) 250 ms after the panel is opened.

---

### 4. `frontend/src/hooks/admin/adminHome/useNotifications.js`

Used by **Admin** role dashboards. Same pattern as `useNotifications.js` but uses `localStorage` key `adminNotifLastSeenTs`.

---

### 5. `frontend/src/hooks/lecturer/dashboard/useLecturerDashboard.js`

Used by **Lecturer / Advisor** dashboards.

- On mount, calls `fetchMyNotifications()` and computes unread count from `localStorage` key defined by `NOTIF_LAST_SEEN_KEY`.
- Subscribes to `notification:new` Socket.IO events.
- Delegates "mark as read" logic to `useNotifications` (see below).

---

### 6. `frontend/src/hooks/lecturer/dashboard/useNotifications.js`

Handles the "mark as read" side-effect for the Lecturer panel:

- Loads and persists the last-seen timestamp via `NOTIF_LAST_SEEN_KEY` in `localStorage`.
- Sets unread count to `0` and updates `localStorage` 250 ms after the notifications panel is opened.

---

### 7. `frontend/src/components/lecturer/dashboard/NotificationPanel.jsx`

Bell-button + dropdown panel used by Lecturer and Advisor dashboards.

- Displays a red badge with the unread count on the bell icon.
- Clicking a notification with a `contract_id` navigates to the contracts page.
- Unread items are highlighted in blue.

---

### 8. `frontend/src/components/management/dashboard/NotificationPanel.jsx`

Dropdown panel used by Management and Admin dashboards.

- Similar visual design to the Lecturer panel.
- Clicking a notification with a `contract_id` navigates to `/management/contracts`.

---

## End-to-End Flow

```
Admin action (e.g. update lecturer courses)
        │
        ▼
Backend controller
  ├─ Persists action in DB
  └─ Calls getNotificationSocket().notifyLecturer() / notifyRole()
            │
            ├─ Saves Notification row(s) to DB
            └─ Emits  notification:new  over Socket.IO
                        │
                        ▼
            Frontend socket listener (notification:new)
              ├─ Prepends notification to local state list
              └─ Increments unread badge count (if panel is closed)

Page load / reconnect
        │
        ▼
fetchMyNotifications()  →  GET /api/notifications
  └─ Loads persisted rows + derived contract-status rows
  └─ Computes unread count from localStorage last-seen timestamp
```

---

## localStorage Keys

| Key                      | Used by                          |
|--------------------------|----------------------------------|
| `adminNotifLastSeenTs`   | Admin dashboard hook             |
| `mgmtNotifLastSeenTs`    | Management dashboard hook        |
| `NOTIF_LAST_SEEN_KEY` (`lecNotifLastSeenTs`) | Lecturer/Advisor dashboard hook  |
