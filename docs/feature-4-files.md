# Feature 4: Harmonic Pattern Recognition

## Mô tả
Đây là feature cốt lõi của hệ thống, chịu trách nhiệm nhận diện các mô hình Harmonic trong dữ liệu thị trường.

## Danh sách file cần triển khai

### Candlestick Pattern Library
```
076. src/libs/candlestick/CandlestickFinder.ts           # Base class cho các finder
077. src/libs/candlestick/Candlestick.ts                 # Class quản lý các loại nến
078. src/libs/candlestick/Doji.ts                        # Pattern Doji
079. src/libs/candlestick/DragonFlyDoji.ts               # Pattern DragonFly Doji
080. src/libs/candlestick/GraveStoneDoji.ts              # Pattern GraveStone Doji
081. src/libs/candlestick/BearishHammerStick.ts          # Pattern BearishHammerStick
082. src/libs/candlestick/BullishHammerStick.ts          # Pattern BullishHammerStick
083. src/libs/candlestick/BearishInvertedHammerStick.ts  # Pattern BearishInvertedHammerStick
084. src/libs/candlestick/BullishInvertedHammerStick.ts  # Pattern BullishInvertedHammerStick
085. src/libs/candlestick/BearishMarubozu.ts             # Pattern BearishMarubozu
086. src/libs/candlestick/BullishMarubozu.ts             # Pattern BullishMarubozu
087. src/libs/candlestick/BearishSpinningTop.ts          # Pattern BearishSpinningTop
088. src/libs/candlestick/BullishSpinningTop.ts          # Pattern BullishSpinningTop
089. src/libs/candlestick/GroupCandlestickFinder.ts      # Finder cho nhóm nến
090. src/libs/candlestick/StockGroupCandleData.ts        # Data class cho nhóm nến
```

### Harmonic Pattern Domain - Entities & DTOs
```
091. src/domain/harmonic-patterns/entities/harmonic-pattern.entity.ts  # Entity mô hình harmonic
092. src/domain/harmonic-patterns/entities/pattern-point.entity.ts     # Entity điểm mô hình

093. src/domain/harmonic-patterns/dtos/pattern.dto.ts                  # DTO mô hình
094. src/domain/harmonic-patterns/dtos/pattern-point.dto.ts            # DTO điểm mô hình
```

### Harmonic Pattern Domain - Interfaces
```
095. src/domain/harmonic-patterns/interfaces/pattern-ratio.interface.ts  # Interface tỷ lệ mô hình
```

### Harmonic Pattern Domain - Services
```
096. src/domain/harmonic-patterns/services/pattern-base.service.ts      # Service cơ sở cho mô hình
097. src/domain/harmonic-patterns/services/cypher-pattern.service.ts    # Service mô hình Cypher
098. src/domain/harmonic-patterns/services/bat-pattern.service.ts       # Service mô hình BAT
099. src/domain/harmonic-patterns/services/butterfly-pattern.service.ts # Service mô hình Butterfly
100. src/domain/harmonic-patterns/services/gartley-pattern.service.ts   # Service mô hình Gartley
101. src/domain/harmonic-patterns/services/crab-pattern.service.ts      # Service mô hình Crab
102. src/domain/harmonic-patterns/services/point-predictor.service.ts   # Service dự đoán điểm
```

### Harmonic Pattern Domain - Controller & Module
```
103. src/domain/harmonic-patterns/controllers/harmonic-pattern.controller.ts  # Controller mô hình harmonic
104. src/domain/harmonic-patterns/harmonic-pattern.module.ts                  # Module mô hình harmonic
```

### Pattern Detector Task
```
164. src/tasks/pattern-detector.task.ts                                      # Task phát hiện mô hình
```

## Thứ tự triển khai đề xuất

1. Xây dựng thư viện nhận diện nến Nhật
2. Triển khai các entities và DTOs
3. Cài đặt pattern-base.service.ts
4. Triển khai từng pattern service (Gartley, Butterfly, v.v.)
5. Triển khai point-predictor.service
6. Tạo controller và module
7. Cài đặt pattern detector task

## Lưu ý triển khai

- **Thư viện Candlestick**: Tập trung vào việc nhận diện mô hình nến Nhật chính xác
- **Pattern Services**: Mỗi service tập trung vào một loại mô hình Harmonic cụ thể
- **Pattern Point**: Xác định các tỷ lệ Fibonacci giữa các điểm
- **Point Predictor**: Dự đoán các điểm tiếp theo của mô hình khi chỉ có 3 điểm
- **Task Scheduling**: Task pattern-detector.task.ts sẽ chạy mỗi 30 giây

## Dependencies chính

- NestJS Schedule (cho cron jobs)
- TypeORM (cho entity management)
- Fibonacci calculation utils
- Mathematical functions