const fs = require("fs");
const axios = require("axios");
const displayBanner = require("./config/banner");
const colors = require("./config/colors");
const CountdownTimer = require("./config/countdown");
const logger = require("./config/logger");

// Constants for API endpoints
const API_CONSTANTS = {
  BASE_URL: "https://quest.redactedairways.com/ecom-gateway",
  ENDPOINTS: {
    USER_INFO: "/user/info",
    TASK_LIST: "/task/list",
    RETWEET: "/task/retweet",
    LIKE: "/task/like",
    FOLLOW: "/task/follow",
    TELEGRAM_AUTH: "/task/telegram-auth",
    REVALIDATE: "/revalidate",
    AUTH: "/auth",
    PARTNER_ACTIVITY: "/partnerActivity",
    PARTNERS: "/partners",
  },
};

// Constants for task actions
const TASK_ACTIONS = {
  RETWEET: "retweet",
  LIKE: "like",
  FOLLOW: "follow",
  TELEGRAM_AUTH: "telegram-auth",
};

// Helper functions
const formatDateTime = (dateTimeStr) => {
  return new Date(dateTimeStr).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

const displayUserInfo = (userData) => {
  logger.info("=== User Information ===");
  logger.info(
    `${colors.accountName}Username: ${colors.accountInfo}${userData.username}${colors.reset}`
  );
  logger.info(
    `${colors.accountName}Overall Score: ${colors.accountInfo}${userData.overall_score}${colors.reset}`
  );
  logger.info(
    `${colors.accountName}Email Verified: ${colors.accountInfo}${
      userData.is_email_verified ? "Yes" : "No"
    }${colors.reset}`
  );
  logger.info(
    `${colors.accountName}Bonus Points: ${colors.accountInfo}${
      userData.got_bonus_points ? "Yes" : "No"
    }${colors.reset}`
  );
  logger.info(
    `${colors.accountName}Telegram Verified: ${colors.accountInfo}${
      userData.isTgVerified ? "Yes" : "No"
    }${colors.reset}`
  );
  logger.info(
    `${colors.accountName}Wallet ID: ${colors.accountInfo}${userData.wallet_id}${colors.reset}`
  );
  logger.info("=== Flight Schedule ===");
  logger.info(
    `${colors.accountName}Start: ${colors.accountInfo}${formatDateTime(
      userData.flight_start_time
    )}${colors.reset}`
  );
  logger.info(
    `${colors.accountName}End: ${colors.accountInfo}${formatDateTime(
      userData.flight_end_time
    )}${colors.reset}`
  );
  logger.info("=====================");
};

// API client setup
const createApiClient = (token) => {
  return axios.create({
    baseURL: API_CONSTANTS.BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.6",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadTokens = () => {
  try {
    const data = fs.readFileSync("data.txt", "utf8");
    return data.split("\n").filter((token) => token.trim() !== "");
  } catch (error) {
    logger.error(
      `${colors.error}Error reading data.txt: ${error.message}${colors.reset}`
    );
    return [];
  }
};

const revalidateSession = async (apiClient) => {
  try {
    const response = await apiClient.post(API_CONSTANTS.ENDPOINTS.REVALIDATE);
    if (response.data.status === "success" && response.data.token) {
      logger.success(
        `${colors.success}Session revalidated successfully with new token${colors.reset}`
      );
      apiClient.defaults.headers[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
      return true;
    }
    return false;
  } catch (error) {
    logger.error(
      `${colors.error}Error revalidating session: ${error.message}${colors.reset}`
    );
    return false;
  }
};

const authenticateSession = async (apiClient) => {
  try {
    const response = await apiClient.get(API_CONSTANTS.ENDPOINTS.AUTH);
    if (response.data.status === "success") {
      logger.success(
        `${colors.success}Session authenticated successfully${colors.reset}`
      );
      return true;
    }
    return false;
  } catch (error) {
    logger.error(
      `${colors.error}Error authenticating session: ${error.message}${colors.reset}`
    );
    return false;
  }
};

const handleTaskExecution = async (apiClient, task) => {
  try {
    const endpoint =
      API_CONSTANTS.ENDPOINTS[task.task_action.toUpperCase().replace("-", "_")];

    let payload;
    if (task.task_action === TASK_ACTIONS.FOLLOW) {
      payload = {
        taskId: task._id,
        twitterId: task.twitter_id,
      };
    } else {
      payload = {
        taskId: task._id,
        tweetId: task.tweet_id,
      };
    }

    const response = await apiClient.post(endpoint, payload);

    if (response.data.status === "success") {
      logger.success(
        `${colors.success}Task completed successfully: ${task.task_name} - Points: ${response.data.points}${colors.reset}`
      );
      return true;
    }
    return false;
  } catch (error) {
    logger.error(
      `${colors.error}Error executing task ${task.task_name}: ${error.message}${colors.reset}`
    );
    return false;
  }
};

const handlePartnerTask = async (apiClient, partnerId, taskType) => {
  try {
    const response = await apiClient.post(
      API_CONSTANTS.ENDPOINTS.PARTNER_ACTIVITY,
      {
        partnerId: partnerId,
        taskType: taskType,
      }
    );

    if (response.data.status === 200) {
      logger.success(
        `${colors.success}Partner task ${taskType} recorded successfully${colors.reset}`
      );
      return true;
    }
    return false;
  } catch (error) {
    logger.error(
      `${colors.error}Error executing partner task: ${error.message}${colors.reset}`
    );
    return false;
  }
};

const getUserInfo = async (apiClient) => {
  try {
    const response = await apiClient.get(API_CONSTANTS.ENDPOINTS.USER_INFO);
    return response.data.userData;
  } catch (error) {
    logger.error(
      `${colors.error}Error getting user info: ${error.message}${colors.reset}`
    );
    return null;
  }
};

const getTaskList = async (apiClient) => {
  try {
    const response = await apiClient.get(API_CONSTANTS.ENDPOINTS.TASK_LIST);
    return response.data.list;
  } catch (error) {
    logger.error(
      `${colors.error}Error getting task list: ${error.message}${colors.reset}`
    );
    return [];
  }
};

const getPartnerTasks = async (apiClient) => {
  try {
    const response = await apiClient.get(API_CONSTANTS.ENDPOINTS.PARTNERS);
    if (response.data.status === 200) {
      const partnerTasks = response.data.data.reduce((tasks, partner) => {
        const partnerTasksWithInfo = partner.tasks.map((task) => ({
          ...task,
          partnerId: partner._id,
          partnerName: partner.partner_name,
        }));
        return [...tasks, ...partnerTasksWithInfo];
      }, []);

      logger.success(
        `${colors.success}Successfully fetched ${partnerTasks.length} partner tasks${colors.reset}`
      );
      return partnerTasks;
    }
    return [];
  } catch (error) {
    logger.error(
      `${colors.error}Error getting partner tasks: ${error.message}${colors.reset}`
    );
    return [];
  }
};

const findNextUnlockTime = (tasks) => {
  const now = new Date();
  let nextUnlockTime = null;

  const lockedTasks = tasks.filter(
    (task) => task.timer && new Date(task.timer) > now && !task.completed
  );

  if (lockedTasks.length > 0) {
    nextUnlockTime = lockedTasks.reduce((earliest, task) => {
      const taskTime = new Date(task.timer);
      return earliest === null || taskTime < earliest ? taskTime : earliest;
    }, null);
  }

  return nextUnlockTime;
};

const processTasks = async (apiClient, regularTasks, partnerTasks = []) => {
  while (true) {
    const filteredTasks = regularTasks.filter(
      (task) => task.task_action !== TASK_ACTIONS.TELEGRAM_AUTH
    );

    const allTasks = [...filteredTasks, ...partnerTasks];
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      (task) => task.completed || task.status === "completed"
    ).length;

    logger.info(
      `${colors.info}Task Progress: ${completedTasks}/${totalTasks} completed${colors.reset}`
    );

    let hasExecutedTask = false;
    const now = new Date();

    for (const task of allTasks) {
      if (task.completed || task.status === "completed") continue;

      if (task.timer && new Date(task.timer) > now) {
        logger.warn(
          `${colors.warning}Task ${
            task.task_name || task.text
          } is time-locked until ${formatDateTime(task.timer)}${colors.reset}`
        );
        continue;
      }

      const taskName = task.task_name || task.text;
      const taskPoints = task.task_points || task.points;

      if (task.partnerId) {
        logger.info(
          `${colors.info}Processing partner task for ${task.partnerName}: ${taskName} (${taskPoints} points)${colors.reset}`
        );
        await handlePartnerTask(apiClient, task.partnerId, task.task_type);
      } else {
        logger.info(
          `${colors.info}Processing task: ${taskName} (${taskPoints} points)${colors.reset}`
        );
        await handleTaskExecution(apiClient, task);
      }

      hasExecutedTask = true;
      await delay(2000);
    }

    const nextUnlockTime = findNextUnlockTime(allTasks);

    if (!hasExecutedTask && nextUnlockTime) {
      const waitTime = nextUnlockTime - now;
      logger.info(
        `${colors.info}Waiting for next task unlock at ${formatDateTime(
          nextUnlockTime
        )}${colors.reset}`
      );

      const timer = new CountdownTimer({
        message: "Time until next unlock: ",
        format: "HH:mm:ss",
      });
      await timer.start(Math.round(waitTime / 1000));
    } else if (!hasExecutedTask) {
      const waitTime = 24 * 60 * 60;
      logger.info(
        `${colors.info}No available tasks, waiting for 24 hours...${colors.reset}`
      );

      const timer = new CountdownTimer({
        message: "Time until next check: ",
        format: "HH:mm:ss",
      });
      await timer.start(waitTime);
    }

    try {
      const [refreshedRegularTasks, refreshedPartnerTasks] = await Promise.all([
        getTaskList(apiClient),
        getPartnerTasks(apiClient),
      ]);

      if (
        refreshedRegularTasks.length > 0 ||
        refreshedPartnerTasks.length > 0
      ) {
        regularTasks = refreshedRegularTasks;
        partnerTasks = refreshedPartnerTasks;
      } else {
        logger.warn(
          `${colors.warning}Failed to refresh tasks, retrying in 30 seconds...${colors.reset}`
        );
        await delay(30000);
      }
    } catch (error) {
      logger.error(
        `${colors.error}Error refreshing tasks: ${error.message}, retrying in 30 seconds...${colors.reset}`
      );
      await delay(30000);
    }
  }
};

const runAutomation = async () => {
  displayBanner();

  const tokens = loadTokens();
  logger.info(`${colors.info}Loaded ${tokens.length} accounts${colors.reset}`);

  for (const [index, token] of tokens.entries()) {
    logger.info(
      `${colors.info}Processing account ${index + 1}/${tokens.length}${
        colors.reset
      }`
    );
    const apiClient = createApiClient(token);

    try {
      const isRevalidated = await revalidateSession(apiClient);
      if (!isRevalidated) {
        logger.error(
          `${colors.error}Failed to revalidate session, skipping account${colors.reset}`
        );
        continue;
      }

      const isAuthenticated = await authenticateSession(apiClient);
      if (!isAuthenticated) {
        logger.error(
          `${colors.error}Failed to authenticate session, skipping account${colors.reset}`
        );
        continue;
      }

      const userInfo = await getUserInfo(apiClient);
      if (!userInfo) {
        logger.error(
          `${colors.error}Failed to get user info, skipping account${colors.reset}`
        );
        continue;
      }

      displayUserInfo(userInfo);

      const [regularTasks, partnerTasks] = await Promise.all([
        getTaskList(apiClient),
        getPartnerTasks(apiClient),
      ]);

      if (regularTasks.length === 0 && partnerTasks.length === 0) {
        logger.error(`${colors.error}No tasks found${colors.reset}`);
        continue;
      }

      await processTasks(apiClient, regularTasks, partnerTasks);
      logger.success(
        `${colors.success}Account processing completed${colors.reset}`
      );

      if (index < tokens.length - 1) {
        await delay(5000);
      }
    } catch (error) {
      logger.error(
        `${colors.error}Error processing account: ${error.message}${colors.reset}`
      );
    }
  }
};

// Start the automation
logger.info(`${colors.info}Starting task automation...${colors.reset}`);
runAutomation()
  .then(() => {
    logger.success(`${colors.success}Automation completed${colors.reset}`);
  })
  .catch((error) => {
    logger.error(`${colors.error}Fatal error: ${error.message}${colors.reset}`);
  });
