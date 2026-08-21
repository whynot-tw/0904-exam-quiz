import { int, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  questionId: varchar("questionId", { length: 100 }).notNull().unique(),
  sourceKey: varchar("sourceKey", { length: 32 }).notNull(),
  sourceSection: varchar("sourceSection", { length: 120 }).notNull(),
  sourceQuestionNo: varchar("sourceQuestionNo", { length: 32 }).notNull(),
  sourcePage: int("sourcePage"),
  category: varchar("category", { length: 80 }),
  subcategory: varchar("subcategory", { length: 80 }),
  subcategoryStatus: varchar("subcategoryStatus", { length: 32 }).default("pending").notNull(),
  subcategoryNotes: text("subcategoryNotes"),
  questionText: text("questionText").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctOption: varchar("correctOption", { length: 1 }).notNull(),
  explanation: text("explanation"),
  enabled: int("enabled").default(1).notNull(),
  requiresMedia: int("requiresMedia").default(0).notNull(),
  sourceRaw: text("sourceRaw"),
  sourceUrl: text("sourceUrl"),
  importStatus: varchar("importStatus", { length: 32 }).default("imported").notNull(),
  verified: int("verified").default(0).notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const attempts = mysqlTable("attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mode: varchar("mode", { length: 32 }).notNull(),
  questionCount: int("questionCount").notNull(),
  correctCount: int("correctCount").default(0).notNull(),
  wrongCount: int("wrongCount").default(0).notNull(),
  score: int("score").default(0).notNull(),
  passed80: int("passed80").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const attemptAnswers = mysqlTable("attemptAnswers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  sequenceNo: int("sequenceNo").notNull(),
  selectedOption: varchar("selectedOption", { length: 1 }).notNull(),
  correctOptionSnapshot: varchar("correctOptionSnapshot", { length: 1 }).notNull(),
  isCorrect: int("isCorrect").notNull(),
  markedReviewError: varchar("markedReviewError", { length: 32 }),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export const wrongQuestions = mysqlTable("wrongQuestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  wrongCount: int("wrongCount").default(1).notNull(),
  consecutiveCorrect: int("consecutiveCorrect").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("待複習").notNull(),
  migrationStatus: varchar("migrationStatus", { length: 24 }).default("matched").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const wrongQuestionConciseExplanations = mysqlTable("wrongQuestionConciseExplanations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  summary: text("summary").notNull(),
  memoryTip: text("memoryTip").notNull(),
  feedback: varchar("feedback", { length: 20 }),
  feedbackAt: timestamp("feedbackAt"),
  generationCount: int("generationCount").default(1).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userQuestionUnique: uniqueIndex("wrongQuestionConciseExplanations_user_question_unique").on(table.userId, table.questionId),
}));

export const starredQuestions = mysqlTable("starredQuestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  tag: varchar("tag", { length: 64 }),
  reminderDate: varchar("reminderDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userQuestionUnique: uniqueIndex("starredQuestions_user_question_unique").on(table.userId, table.questionId),
}));

export const reviewNotes = mysqlTable("reviewNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  noteType: varchar("noteType", { length: 32 }).notNull(),
  noteText: text("noteText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  notes: text("notes"),
});

export const userLearningSettings = mysqlTable("userLearningSettings", {
  userId: int("userId").primaryKey(),
  targetCompletion: int("targetCompletion").default(60).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const classificationReviewBatches = mysqlTable("classificationReviewBatches", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  questionIdsJson: text("questionIdsJson").notNull(),
  beforeStatesJson: text("beforeStatesJson").notNull(),
  appliedSubcategory: varchar("appliedSubcategory", { length: 80 }).notNull(),
  appliedStatus: varchar("appliedStatus", { length: 32 }).notNull(),
  appliedNotes: text("appliedNotes"),
  restoredAt: timestamp("restoredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Question = typeof questions.$inferSelect;
