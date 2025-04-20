// 186. README.md
# Harmonic Trading System

A system for detecting and trading based on harmonic patterns in the cryptocurrency market.

## Description

The Harmonic Trading System is designed to automatically detect harmonic patterns in cryptocurrency price charts and execute trades based on these patterns. The system uses the Binance API for market data and trading execution.

## Features

- Detection of various harmonic patterns (Gartley, Butterfly, Bat, Crab, Cypher)
- Technical indicators (RSI, MACD, Ichimoku Cloud)
- Automated trading with risk management
- Real-time notifications via Telegram
- Backtesting of trading strategies
- Performance analysis and reporting

## Prerequisites

- Node.js (>= 18.x)
- npm (>= 9.x) or yarn (>= 1.22.x)
- PostgreSQL (>= 14.x)
- Redis (>= 6.x)
- Docker & Docker Compose (optional, for containerized setup)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url> harmonic-trading-system
   cd harmonic-trading-system
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   And edit the `.env` file with your configuration.

4. Start the application:
   ```bash
   # Development mode
   yarn start:dev
   
   # Production mode
   yarn start:prod
   ```

## Docker Setup

You can also run the application using Docker:

```bash
# Development environment
yarn docker:dev

# Production environment
yarn docker:prod
```

## Running Migrations

```bash
# Run migrations
yarn migration:run

# Generate a new migration
yarn migration:generate -- src/infrastructure/database/migrations/NAME
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## License

[MIT](LICENSE)
