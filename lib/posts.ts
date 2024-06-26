import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypePrism from "rehype-prism-plus";
import rehypeRaw from "rehype-raw";

// put posts under posts, so the image paths can be resolved by other markdown editors.
const postsDirectory = path.join(process.cwd(), "public/posts");

export function getSortedPostsData() {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames
    .filter((fileName) => {
      return fileName.endsWith(".md");
    })
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");

      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      const matterResult = matter(fileContents);

      return {
        id,
        ...(matterResult.data as {
          date: string;
          title: string;
          tags?: string[];
        }),
      };
    });
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex, { strict: false })
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeStringify)
    .process(matterResult.content);

  // relative path to absolute path
  const contentHtml = processedContent
    .toString()
    .replace(/src="\.\/(.*?)"/g, `src="/posts/$1"`);

  return {
    id,
    contentHtml,
    ...(matterResult.data as { date: string; title: string; tags?: string[] }),
  };
}
