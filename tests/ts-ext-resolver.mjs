// Feature: horizontal-tab-navigation
// 확장자 없는 상대 import(.ts)를 해석하기 위한 최소 ESM resolve 훅.
// app/tabnav/reselectActiveTab.ts 가 './resolveActiveTab'를 확장자 없이 import하므로
// Node의 ESM 로더가 이를 찾지 못한다. 이 훅은 확장자 없는 상대 지정자에 대해
// 형제 '.ts' 파일이 존재하면 해당 경로로 재해석한다. (구현/공유 테스트 파일 불변)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.[cm]?[jt]sx?$/.test(specifier)
  ) {
    try {
      const candidateUrl = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(candidateUrl))) {
        return nextResolve(specifier + ".ts", context);
      }
    } catch {
      // 무시하고 기본 해석으로 넘어감
    }
  }
  return nextResolve(specifier, context);
}
