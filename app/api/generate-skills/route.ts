import { generateSkill, generateAllSkills, generateSkillFromGithub } from "@/lib/skill-generator/skill-generator-engine";
import { getTopicCategories } from "@/lib/topic-index";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const categoryId = body.categoryId as string | undefined;
    const githubUrl = body.githubUrl as string | undefined;

    if (githubUrl) {
      const result = await generateSkillFromGithub(githubUrl);
      return Response.json({
        skills: [result.config],
        outputPath: `.claude/skills/${result.config.name}`,
        fileCount: result.fileCount,
        truncated: result.truncated,
      });
    }

    if (categoryId) {
      const result = await generateSkill(categoryId);
      if (!result) {
        return Response.json(
          { error: `Category '${categoryId}' not found` },
          { status: 404 }
        );
      }
      return Response.json({
        skills: [result.config],
        outputPath: `.claude/skills/${result.config.name}`,
      });
    }

    // Generate all skills
    const results = await generateAllSkills();
    return Response.json({
      skills: results.map((r) => r.config),
      outputPath: ".claude/skills",
      count: results.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const categories = await getTopicCategories();
  return Response.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      fileCount: c.files.length,
    })),
  });
}
