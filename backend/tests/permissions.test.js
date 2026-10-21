/**
 * Day 1 permission unit tests (Jest).
 * Run: npm test
 */
const {
  canCreateProject,
  canAssignTasks,
  canUpdateTaskStatus,
  canManageTaskWatchers,
  isAdmin,
} = require("../constants/taskConstants");

describe("Permission helpers", () => {
  test("only admin creates projects", () => {
    expect(canCreateProject("admin")).toBe(true);
    expect(canCreateProject("member")).toBe(false);
  });

  test("members cannot assign tasks", () => {
    expect(canAssignTasks("owner", "member")).toBe(true);
    expect(canAssignTasks("member", "member")).toBe(false);
  });

  test("member can update status only on assigned task", () => {
    const task = { assignee: "user1" };
    expect(canUpdateTaskStatus(task, "user1", "member", "member")).toBe(true);
    expect(canUpdateTaskStatus(task, "user2", "member", "member")).toBe(false);
  });

  test("admin bypass", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  test("task watcher management by role", () => {
    const task = { assignee: "user1" };
    expect(canManageTaskWatchers(task, "admin1", null, "admin")).toBe(true);
    expect(canManageTaskWatchers(task, "owner1", "owner", "member")).toBe(true);
    expect(canManageTaskWatchers(task, "user1", "member", "member")).toBe(
      true
    );
    expect(canManageTaskWatchers(task, "user2", "member", "member")).toBe(false);
    expect(canManageTaskWatchers(task, "user1", "owner", "member")).toBe(true);
  });
});
