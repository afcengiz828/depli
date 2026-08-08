import {TechStackService} from "./tech-stack.service";

describe('TechStackService', () => {
    let service: TechStackService;
    let combinationTrue_1 = {
        backend: 'nodejs',
        backendVersion: '20.5.0',
        frontend: 'react',
        frontendVersion: '18.2.0',
        database: 'postgresql',
        databaseVersion: '16'
    };
    let combinationFalse_1 = {
        backend: 'rust',
        backendVersion: '20.5.0',
        frontend: 'react',
        frontendVersion: '18.2.0',
        database: 'mongodb',
        databaseVersion: '15'
    };
    let combinationFalse_2 = {
        backend: 'nodejs',
        backendVersion: '21.5.0',
        frontend: 'react',
        frontendVersion: '18.2.0',
        database: 'postgresql',
        databaseVersion: '16'
    };
    // Sadece frontend geçersiz, diğerleri geçerli
    let combinationFalse_3 = {
        backend: 'nodejs',
        backendVersion: '20.5.0',  // ← geçerli
        frontend: 'html',           // ← geçersiz
        frontendVersion: '18.2.0',
        database: 'postgresql',
        databaseVersion: '16'
    }

// Sadece frontendVersion geçersiz, diğerleri geçerli
    let combinationFalse_4 = {
        backend: 'nodejs',
        backendVersion: '20.5.0',  // ← geçerli
        frontend: 'react',
        frontendVersion: '18.456.0', // ← geçersiz
        database: 'postgresql',
        databaseVersion: '16'
    }

    // Sadece database geçersiz
    let combinationFalse_5 = {
        backend: 'nodejs',
        backendVersion: '20.5.0',
        frontend: 'react',
        frontendVersion: '18.2.0',
        database: 'oracle',      // ← geçersiz
        databaseVersion: '16'
    }

// Sadece databaseVersion geçersiz
    let combinationFalse_6 = {
        backend: 'nodejs',
        backendVersion: '20.5.0',
        frontend: 'react',
        frontendVersion: '18.2.0',
        database: 'postgresql',
        databaseVersion: '99'    // ← geçersiz
    }

    beforeEach(() => {
        service = new TechStackService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true for valid tech stack combination', () => {
        expect(service.isValidTechStack(combinationTrue_1)).toBe(true);
    });

    it('should return false for invalid tech stack combination (invalid backend)', () => {
        expect(service.isValidTechStack(combinationFalse_1)).toBe(false);
    });

    it('should return false for invalid tech stack combination (invalid backend version)', () => {
        expect(service.isValidTechStack(combinationFalse_2)).toBe(false);
    });
    
    it('should return false for invalid tech stack combination (invalid frontend)', () => {
        expect(service.isValidTechStack(combinationFalse_3)).toBe(false);
    });

    it('should return false for invalid tech stack combination (invalid frontend version)', () => {
        expect(service.isValidTechStack(combinationFalse_4)).toBe(false);
    });       
    
    it('should return false for invalid tech stack combination (invalid database)', () => {
        expect(service.isValidTechStack(combinationFalse_5)).toBe(false);
    });

    it('should return false for invalid tech stack combination (invalid database version)', () => {
        expect(service.isValidTechStack(combinationFalse_6)).toBe(false);
    }); 

    describe('preset validation', () => {
        it('should return true for valid preset image', () => {
            expect(service.isValidPreset('MERN Stack')).toBe(true);
        });

        it('should return false for invalid preset image', () => {
            expect(service.isValidPreset('COBOL Stack')).toBe(false);
        });
    });

});