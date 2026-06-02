"use server";

import {
  getAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  type Annotation,
} from "@/lib/annotations-db";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

export async function getAnnotationsAction(
  filePath: string
): Promise<Annotation[]> {
  if (!filePath || filePath.includes("..")) {
    throw new Error("Invalid file path");
  }
  return getAnnotations(filePath);
}

export async function addAnnotationAction(
  annotation: Omit<Annotation, "createdAt" | "updatedAt">
): Promise<Annotation> {
  if (!annotation.id || !annotation.filePath) {
    throw new Error("Missing required fields");
  }
  if (annotation.filePath.includes("..")) {
    throw new Error("Invalid file path");
  }
  if (
    typeof annotation.startOffset !== "number" ||
    typeof annotation.endOffset !== "number" ||
    annotation.startOffset >= annotation.endOffset
  ) {
    throw new Error("Invalid offsets");
  }
  if (!HEX_COLOR_RE.test(annotation.color)) {
    throw new Error("Invalid color format");
  }
  if (annotation.selectedText.length > 1000) {
    throw new Error("Selected text too long");
  }
  if (annotation.note.length > 5000) {
    throw new Error("Note too long");
  }
  return addAnnotation(annotation);
}

export async function updateAnnotationAction(
  id: string,
  updates: { note?: string; color?: string }
): Promise<boolean> {
  if (!id) throw new Error("Missing annotation ID");
  if (updates.color && !HEX_COLOR_RE.test(updates.color)) {
    throw new Error("Invalid color format");
  }
  if (updates.note && updates.note.length > 5000) {
    throw new Error("Note too long");
  }
  return updateAnnotation(id, updates);
}

export async function deleteAnnotationAction(
  id: string
): Promise<boolean> {
  if (!id) throw new Error("Missing annotation ID");
  return deleteAnnotation(id);
}
