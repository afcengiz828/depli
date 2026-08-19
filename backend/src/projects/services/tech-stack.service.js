"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechStackService = void 0;
const tech_stack_config_1 = require("../config/tech-stack.config");
class TechStackService {
    isValidTechStack(combination) {
        return (Object.keys(tech_stack_config_1.techStack.backend).includes(combination.backend) &&
            (tech_stack_config_1.techStack.backend[combination.backend]?.versions.includes(combination.backendVersion) ?? false) &&
            Object.keys(tech_stack_config_1.techStack.frontend).includes(combination.frontend) &&
            (tech_stack_config_1.techStack.frontend[combination.frontend]?.versions.includes(combination.frontendVersion) ?? false) &&
            Object.keys(tech_stack_config_1.techStack.database).includes(combination.database) &&
            (tech_stack_config_1.techStack.database[combination.database]?.versions.includes(combination.databaseVersion) ?? false));
    }
    isValidPreset(preset) {
        return tech_stack_config_1.ImagesList.some(image => image.name === preset);
    }
}
exports.TechStackService = TechStackService;
//# sourceMappingURL=tech-stack.service.js.map