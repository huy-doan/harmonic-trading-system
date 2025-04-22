# Feature 8: Task Scheduling & Event Bus

## Mô tả
Feature này cung cấp cơ chế lập lịch cho các tác vụ định kỳ và hệ thống event bus để truyền thông tin giữa các thành phần trong hệ thống.

## Danh sách file cần triển khai

### Queue & Task Processing
```
069. src/infrastructure/queue/queue.service.ts              # Service hàng đợi cơ bản
070. src/infrastructure/queue/bull-queue.service.ts         # Service Bull queue
071. src/infrastructure/queue/queue.module.ts               # Module queue
```

### Event Bus System
```
072. src/infrastructure/event-bus/event-bus.service.ts          # Service truyền sự kiện
073. src/infrastructure/event-bus/event-bus.module.ts           # Module event bus
074. src/infrastructure/event-bus/event-handlers/market-data-handler.ts    # Xử lý dữ liệu thị trường mới
075. src/infrastructure/event-bus/event-handlers/pattern-detected-handler.ts # Xử lý phát hiện mô hình
```

### Task Scheduling
```
162. src/tasks/tasks.module.ts                   # Module tasks
163. src/tasks/tasks.service.ts                  # Service quản lý tasks
164. src/tasks/pattern-detector.task.ts          # Task phát hiện mô hình
165. src/tasks/market-analyzer.task.ts           # Task phân tích thị trường
166. src/tasks/trade-executor.task.ts            # Task thực thi giao dịch
```

## Chi tiết triển khai

### Queue System

#### queue.service.ts
Service cơ sở cho hệ thống queue:
- Định nghĩa interface chung
- Cung cấp các phương thức cơ bản (add, process, remove)
- Xử lý lỗi và retry

#### bull-queue.service.ts
Triển khai queue service sử dụng Bull:
- Tạo và quản lý các queue
- Xử lý concurrency
- Đặt lịch cho job
- Xử lý lỗi và retry

### Event Bus System

#### event-bus.service.ts
Service quản lý việc truyền và xử lý sự kiện:
- Tạo và gửi sự kiện
- Đăng ký event handler
- Theo dõi event trong hệ thống

#### market-data-handler.ts
Handler xử lý sự kiện khi có dữ liệu thị trường mới:
- Phân tích dữ liệu
- Cập nhật cache
- Kích hoạt các service liên quan

#### pattern-detected-handler.ts
Handler xử lý sự kiện khi phát hiện mô hình mới:
- Tạo thiết lập giao dịch
- Gửi thông báo
- Cập nhật lịch sử

### Task Scheduling

#### tasks.service.ts
Service quản lý các tác vụ định kỳ:
- Đăng ký và quản lý các task
- Xử lý lỗi khi chạy task
- Ghi log thông tin task

#### pattern-detector.task.ts
Task phát hiện mô hình Harmonic:
- Chạy mỗi 30 giây
- Quét dữ liệu thị trường mới nhất
- Tìm kiếm các mô hình Harmonic
- Phát ra sự kiện khi phát hiện mô hình

#### market-analyzer.task.ts
Task phân tích thị trường:
- Chạy mỗi giờ
- Phân tích xu hướng thị trường
- Tính toán các chỉ báo kỹ thuật
- Cập nhật dữ liệu thị trường

#### trade-executor.task.ts
Task thực thi giao dịch:
- Chạy mỗi phút
- Kiểm tra các thiết lập giao dịch đang chờ
- Thực hiện giao dịch khi điều kiện thỏa mãn
- Quản lý các giao dịch đang mở

## Thứ tự triển khai đề xuất

1. Xây dựng hệ thống queue cơ bản
2. Triển khai event bus service
3. Tạo các event handler
4. Xây dựng task service
5. Triển khai từng task cụ thể

## Dependencies chính

- Bull (cho queue processing)
- Redis (cho Bull và event storage)
- NestJS Schedule (cho cron jobs)
- RxJS (cho event handling)