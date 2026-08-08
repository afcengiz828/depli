import { ImagesList, techStack } from "../config/tech-stack.config";

export class TechStackService {

  public isValidTechStack(combination: {
    backend: string;
    backendVersion: string;
    frontend: string;
    frontendVersion: string;
    database: string;
    databaseVersion: string;
  }): boolean {
    return (
      Object.keys(techStack.backend).includes(combination.backend) &&
      (techStack.backend[combination.backend]?.versions.includes(combination.backendVersion) ?? false) &&
      Object.keys(techStack.frontend).includes(combination.frontend) &&
      (techStack.frontend[combination.frontend]?.versions.includes(combination.frontendVersion) ?? false) &&
      Object.keys(techStack.database).includes(combination.database) &&
      (techStack.database[combination.database]?.versions.includes(combination.databaseVersion) ?? false)
    );
  }

  public isValidPreset(preset: string): boolean {
    return ImagesList.some(image => image.name === preset);
  }
}