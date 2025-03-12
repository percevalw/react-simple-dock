import { test, expect } from "@playwright/test";

test("drag and drop", async ({ page }, testInfo) => {
    await page.goto("http://localhost:3000");
    await expect(page).toHaveScreenshot("initial.png", { maxDiffPixelRatio: 0.01 });

    // Locate the element to be moved
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const element = page.getByText("panel-4");

    // Get the bounding box of the element
    const box = await element.boundingBox();
    if (!box) throw new Error("Element not found or not visible");

    // Target coordinates (example: move to x: 400, y: 300)
    const targetX = 640;
    const targetY = 540;
    const steps = 20;

    // Perform the drag-and-drop
    const handleX = box.x + box.width / 2;
    const handleY = box.y + box.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.mouse.move(handleX + 1, handleY + 1);

    if (!testInfo.project.use.headless) {
        await page.waitForTimeout(1000);
    }

    await page.mouse.down();

    for (let i = 0; i <= steps; i++) {
        let x = handleX + ((targetX - handleX) * i) / steps;
        let y = handleY + ((targetY - handleY) * i) / steps;
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(50); // Small delay for smooth effect
    }
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();
    await expect(page).toHaveScreenshot("after_drag_and_drop.png", { maxDiffPixelRatio: 0.01 });

    if (!testInfo.project.use.headless) {
        await page.waitForTimeout(1000);
    }
});
