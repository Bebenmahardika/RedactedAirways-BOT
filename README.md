# RedactedAirways BOT

An automation bot for [RedactedAirways Quest](https://quest.redactedairways.com/?r=ZQ40DL) built with Node.js.

## Features

- Automatic task execution
- Token-based multi-account support
- Dynamic task unlock monitoring
- Telegram auth task skipping
- Colored console output
- Countdown timer display
- Continuous 24-hour operation

## Prerequisites

- Node.js installed
- Active RedactedAirways account
- Twitter account connected to RedactedAirways

## Installation

1. Clone the repository

```bash
git clone https://github.com/Galkurta/RedactedAirways-BOT.git
```

2. Install dependencies

```bash
cd RedactedAirways-BOT
npm install
```

3. Create data.txt file and add your account tokens

```txt
token1
token2
token3
```

## Configuration

The bot can be configured through multiple files in the config folder:

- `banner.js` - Display configuration for bot banner
- `colors.js` - Color scheme configuration
- `countdown.js` - Timer display configuration
- `logger.js` - Logging configuration

## Usage

Run the bot using:

```bash
node main.js
```

## Features Details

### Task Processing

- Automatically executes unlocked tasks
- Monitors time-locked tasks
- Skips Telegram authentication tasks
- Waits for task unlock times

### Account Management

- Supports multiple accounts via tokens
- Individual account progress tracking
- Session revalidation and authentication

### Display Features

- Colored console output
- Progress tracking
- Countdown timers
- Task status display
- Account information display

### Error Handling

- Failed task retry
- Session revalidation
- Task list refresh
- Network error recovery

## Register

Join [RedactedAirways](https://quest.redactedairways.com/?r=ZQ40DL)

## Contact

- GitHub: [https://github.com/Galkurta](https://github.com/Galkurta)
- Telegram: [https://t.me/galkurtarchive](https://t.me/galkurtarchive)

## Disclaimer

This bot is for educational purposes only. Use at your own risk. The developer is not responsible for any account bans or penalties resulting from the use of this bot.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
