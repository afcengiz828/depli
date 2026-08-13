import { IsString, IsOptional, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TechStackDto {
  @IsString()
  backend: string;

  @IsString()
  backendVersion: string;

  @IsString()
  frontend: string;

  @IsString()
  frontendVersion: string;

  @IsString()
  database: string;

  @IsString()
  databaseVersion: string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  githubUrl: string;

  @ValidateNested()
  @Type(() => TechStackDto)
  techStack: TechStackDto;

  @IsString()
  @IsOptional()
  githubToken?: string;

  @IsString()
  @IsOptional()
  presetName?: string;
}