import { execSync } from "child_process";
import fetch from "node-fetch";

export async function updateGiso(currentVersion) {
  const packageName = "giso";
  const npmPackageUrl = `https://registry.npmjs.org/${packageName}`;

  try {
    console.log(`Current installed version: ${currentVersion}`);
    console.log(`Checking for updates on npm...`);

    const response = await fetch(npmPackageUrl);
    if (!response.ok) {
      console.error(
        `Failed to fetch package info from npm: ${response.status}`,
      );
      return 1; // Indicate failure
    }

    const data = await response.json();
    const latestVersion = data["dist-tags"]?.latest;

    if (!latestVersion) {
      console.error("Could not determine the latest version from npm.");
      return 1; // Indicate failure
    }

    console.log(`Latest version on npm: ${latestVersion}`);

    if (latestVersion !== currentVersion) {
      console.log("A new version is available. Updating...");
      try {
        execSync(`npm install -g ${packageName}@latest`, { stdio: "inherit" });
        console.log(`Successfully updated to version ${latestVersion}`);
        return 0; // Indicate success
      } catch (error) {
        console.error("Update failed:", error.message);
        return 1; // Indicate failure
      }
    } else {
      console.log("You are already using the latest version.");
      return 0; // Indicate success (no update needed)
    }
  } catch (error) {
    console.error("Error during update check:", error.message);
    return 1; // Indicate failure
  }
}
