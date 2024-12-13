const fetch = require("node-fetch");
const DiscordRPC = require("discord-rpc");

const DISCORD_CLIENT_ID = "1317171584825561159";
const LEETCODE_USERNAME = "shivamkalra123";

// Create Discord RPC client
const rpc = new DiscordRPC.Client({ transport: "ipc" });

async function fetchLeetCodeActivity(username) {
  const query = `
    query recentSubmissions($username: String!) {
      recentAcSubmissionList(username: $username, limit: 1) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { username },
    }),
  });

  const data = await response.json();
  if (data.data.recentAcSubmissionList.length > 0) {
    return data.data.recentAcSubmissionList[0];
  } else {
    return null;
  }
}

function getTimeOfDay() {
  const hours = new Date().getHours();
  if (hours >= 6 && hours < 12) {
    return "Morning Grind";
  } else if (hours >= 12 && hours < 18) {
    return "Afternoon Coding";
  } else {
    return "Night-Time Problem Solving";
  }
}

async function updateDiscordStatus(problem) {
  if (!problem) {
    console.log("No recent activity found.");
    return;
  }

  const timeOfDay = getTimeOfDay();

  rpc.setActivity({
    details: `Solving: ${problem.title}`,
    state: `${timeOfDay} on LeetCode 💻`,
    startTimestamp: Date.now(),
    largeImageKey: "leetcode_logo",
    largeImageText: `Problem: ${problem.title}`,
    smallImageKey: "depressed", // Optional: small image for additional details
    smallImageText: "Keep solving!", // Optional: small image text
    // Make the application title clickable to your LeetCode profile
  });

  console.log(`Updated Discord status: ${problem.title}`);
}

// Main function that runs the periodic update
async function main() {
  rpc.on("ready", async () => {
    console.log("Connected to Discord!");

    // Perform the first update once when the app is ready
    try {
      const problem = await fetchLeetCodeActivity(LEETCODE_USERNAME);
      await updateDiscordStatus(problem); // Initial update
    } catch (error) {
      console.error("Error fetching LeetCode data:", error);
    }

    // Then periodically update every 15 minutes (900000 ms)
    setInterval(async () => {
      try {
        const problem = await fetchLeetCodeActivity(LEETCODE_USERNAME);
        await updateDiscordStatus(problem); // Periodic update
      } catch (error) {
        console.error("Error fetching LeetCode data:", error);
      }
    }, 15 * 60 * 1000); // Update every 15 minutes (900000ms)
  });

  // Log into Discord RPC
  rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(console.error);
}

// Start the main function
main();
