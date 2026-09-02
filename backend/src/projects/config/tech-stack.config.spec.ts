import {ImagesList, techStack} from "./tech-stack.config";

describe("TechStack Config", () => {

    it("should have correct tech stack structure", () => {
        expect(techStack).toBeDefined();
        expect(techStack).not.toEqual({});
        expect(techStack).toHaveProperty("frontend");
        expect(techStack).toHaveProperty("backend");
        expect(techStack).toHaveProperty("database");

        for (const [key, value] of Object.entries(techStack)) {
            switch (key) {
                case "frontend":
                    expect(value).toHaveProperty("react");
                    expect(value).toHaveProperty("angular");
                    expect(value).toHaveProperty("vue");
                    expect(value).toHaveProperty("svelte");
                    expect(value).toHaveProperty("nextjs");
                    break;
                case "backend":
                    expect(value).toHaveProperty("nodejs");
                    expect(value).toHaveProperty("python");
                    expect(value).toHaveProperty("php");
                    expect(value).toHaveProperty("java");
                    expect(value).toHaveProperty("go");
                    break;
                case "database":
                    expect(value).toHaveProperty("postgresql");
                    expect(value).toHaveProperty("mysql");
                    expect(value).toHaveProperty("mongodb");
                    expect(value).toHaveProperty("redis");
                    break;
            }

            for (const [subKey, subValue] of Object.entries(value as any)) {
                expect(subValue).toBeDefined();
                expect(subValue).not.toEqual({});
                expect(subValue).toHaveProperty("versions");
                expect((subValue as any)?.versions).toBeInstanceOf(Array);
                expect(subValue).toHaveProperty("baseImage");
                expect(typeof (subValue as any)?.baseImage).toBe("string");

                if ((subValue as any)?.imageTag !== undefined) {
                    expect(typeof (subValue as any)?.imageTag).toBe("string");
                }

                // startCommand sadece frontend ve backend'de olmalı, database'de olmamalı
                if (key === "frontend" || key === "backend") {
                    expect(subValue).toHaveProperty("startCommand");
                    expect(typeof (subValue as any)?.startCommand).toBe("string");
                } else if (key === "database") {
                    expect(subValue).not.toHaveProperty("startCommand");
                }
            }
        }
    });

    it("should have a images list", () => {
        expect(ImagesList).toBeDefined();
        expect(ImagesList).toBeInstanceOf(Array);
        expect(ImagesList.length).toBeGreaterThan(0);

        for (const image of ImagesList) {
            for (const [key, value] of Object.entries(image)) {

                expect(["name", "description", "techStack"]).toContain(key);

                if (["name", "description"].includes(key)) {
                    expect(value).toBeDefined();
                    expect(typeof value).toBe("string");
                    expect(value).not.toEqual("");
                } else {
                    expect(value).toBeDefined();
                    expect(value).not.toEqual({});
                    expect(value).toHaveProperty("backend");
                    expect(typeof (value as any)?.backend).toBe("string");
                    expect(value).toHaveProperty("backendVersion");
                    expect(typeof (value as any)?.backendVersion).toBe("string");
                    expect(value).toHaveProperty("frontend");
                    expect(typeof (value as any)?.frontend).toBe("string");
                    expect(value).toHaveProperty("frontendVersion");
                    expect(typeof (value as any)?.frontendVersion).toBe("string");
                    expect(value).toHaveProperty("database");
                    expect(typeof (value as any)?.database).toBe("string");
                    expect(value).toHaveProperty("databaseVersion");
                    expect(typeof (value as any)?.databaseVersion).toBe("string");

                    expect(['nodejs', 'python', 'php', 'java', 'go'])
                    .toContain((value as any)?.backend);
                    expect(['react', 'vue', 'angular', 'svelte', 'nextjs'])
                    .toContain((value as any)?.frontend);
                    expect(['postgresql', 'mysql', 'mongodb', 'redis'])
                    .toContain((value as any)?.database);
                }
            }
        }
    });
});
