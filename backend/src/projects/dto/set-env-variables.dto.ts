import { IsObject } from "class-validator";

export class SetEnvVariablesDto {
    @IsObject()
    variables: Record<string, string>;
}
