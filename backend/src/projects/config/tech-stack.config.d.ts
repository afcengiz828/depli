export declare let techStack: {
    frontend: {
        react: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        angular: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        vue: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        svelte: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        nextjs: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
    };
    backend: {
        nodejs: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        python: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        php: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        java: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        go: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
    };
    database: {
        postgresql: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
        mysql: {
            versions: string[];
            baseImage: string;
            imageTag: undefined;
        };
        mongodb: {
            versions: string[];
            baseImage: string;
            imageTag: undefined;
        };
        redis: {
            versions: string[];
            baseImage: string;
            imageTag: string;
        };
    };
};
export declare let ImagesList: {
    name: string;
    description: string;
    techStack: {
        backend: string;
        backendVersion: string;
        frontend: string;
        frontendVersion: string;
        database: string;
        databaseVersion: string;
    };
}[];
