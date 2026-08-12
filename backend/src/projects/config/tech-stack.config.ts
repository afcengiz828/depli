export let techStack = {
  frontend: {
    react: { versions: ['18.2.0', '17.0.2'], baseImage: 'node', imageTag: 'alpine' },
    angular: { versions: ['15.2.0', '14.2.0'], baseImage: 'node', imageTag: 'alpine' },
    vue: { versions: ['3.2.47', '2.7.14'], baseImage: 'node', imageTag: 'alpine' },
    svelte: { versions: ['4.1.4', '3.59.1'], baseImage: 'node', imageTag: 'alpine' },
    nextjs: { versions: ['13.4.12', '12.3.4'], baseImage: 'node', imageTag: 'alpine' },
  },
  backend: {
    nodejs: { versions: ['20.5.0', '18.18.0'], baseImage: 'node', imageTag: 'alpine' },
    python: { versions: ['3.12.0', '3.11.8'], baseImage: 'python', imageTag: 'alpine' },
    php: { versions: ['8.2.12', '8.1.22'], baseImage: 'php', imageTag: 'fpm-alpine' },
    java: { versions: ['21', '20'], baseImage: 'openjdk', imageTag: 'alpine' },
    go: { versions: ['1.23', '1.22'], baseImage: 'golang', imageTag: 'alpine' },
  },
  database: {
    postgresql: { versions: ['16', '15'], baseImage: 'postgres', imageTag: 'alpine' },
    mysql: { versions: ['8.0', '5.7'], baseImage: 'mysql', imageTag: undefined },
    mongodb: { versions: ['6.0', '5.0'], baseImage: 'mongo', imageTag: undefined },
    redis: { versions: ['7.0', '6.2'], baseImage: 'redis', imageTag: 'alpine' },
  }
}

export let ImagesList = [
  {
    name: 'MERN Stack',
    description: 'MongoDB, Express, React, Node.js full-stack JavaScript uygulamaları için.',
    techStack: {
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'react',
      frontendVersion: '18.2.0',
      database: 'mongodb',
      databaseVersion: '6.0',
    }
  },
  {
    name: 'Node + Next.js + Postgres',
    description: 'Server-side rendering ve güçlü ilişkisel veritabanı gerektiren projeler için.',
    techStack: {
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'nextjs',
      frontendVersion: '13.4.12',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'Node + Vue + MySQL',
    description: 'Vue.js ve MySQL ile hafif, hızlı full-stack JavaScript uygulamaları için.',
    techStack: {
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'vue',
      frontendVersion: '3.2.47',
      database: 'mysql',
      databaseVersion: '8.0',
    }
  },
  {
    name: 'Node + Angular + Postgres',
    description: 'Kurumsal ölçekli Angular uygulamaları için Node.js ve PostgreSQL.',
    techStack: {
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'angular',
      frontendVersion: '15.2.0',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'Node + Svelte + MongoDB',
    description: 'Performans odaklı Svelte uygulamaları için Node.js ve MongoDB.',
    techStack: {
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'svelte',
      frontendVersion: '4.1.4',
      database: 'mongodb',
      databaseVersion: '6.0',
    }
  },
  {
    name: 'Python + React + Postgres',
    description: 'FastAPI/Django backend ile React SPA ve PostgreSQL kombinasyonu.',
    techStack: {
      backend: 'python',
      backendVersion: '3.12.0',
      frontend: 'react',
      frontendVersion: '18.2.0',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'Python + Vue + MySQL',
    description: 'Python backend ile Vue.js ve MySQL kullanan veri odaklı uygulamalar için.',
    techStack: {
      backend: 'python',
      backendVersion: '3.12.0',
      frontend: 'vue',
      frontendVersion: '3.2.47',
      database: 'mysql',
      databaseVersion: '8.0',
    }
  },
  {
    name: 'PHP + Vue + MySQL',
    description: 'Laravel backend ile Vue.js ve MySQL — klasik modern web stack.',
    techStack: {
      backend: 'php',
      backendVersion: '8.2.12',
      frontend: 'vue',
      frontendVersion: '3.2.47',
      database: 'mysql',
      databaseVersion: '8.0',
    }
  },
  {
    name: 'PHP + React + Postgres',
    description: 'PHP backend ile React ve PostgreSQL kullanan modern web uygulamaları için.',
    techStack: {
      backend: 'php',
      backendVersion: '8.2.12',
      frontend: 'react',
      frontendVersion: '18.2.0',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'PHP + Angular + MySQL',
    description: 'PHP ve Angular ile kurumsal web uygulamaları, MySQL veritabanı ile.',
    techStack: {
      backend: 'php',
      backendVersion: '8.2.12',
      frontend: 'angular',
      frontendVersion: '15.2.0',
      database: 'mysql',
      databaseVersion: '8.0',
    }
  },
  {
    name: 'Java + Angular + Postgres',
    description: 'Spring Boot ve Angular ile kurumsal uygulamalar, PostgreSQL ile.',
    techStack: {
      backend: 'java',
      backendVersion: '21',
      frontend: 'angular',
      frontendVersion: '15.2.0',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'Java + React + MySQL',
    description: 'Spring Boot backend ile React ve MySQL kullanan kurumsal uygulamalar için.',
    techStack: {
      backend: 'java',
      backendVersion: '21',
      frontend: 'react',
      frontendVersion: '18.2.0',
      database: 'mysql',
      databaseVersion: '8.0',
    }
  },
  {
    name: 'Go + React + Postgres',
    description: 'Yüksek performanslı Go API ile React ve PostgreSQL kombinasyonu.',
    techStack: {
      backend: 'go',
      backendVersion: '1.23',
      frontend: 'react',
      frontendVersion: '18.2.0',
      database: 'postgresql',
      databaseVersion: '16',
    }
  },
  {
    name: 'Go + Vue + MongoDB',
    description: 'Go backend ile Vue.js ve MongoDB kullanan esnek, hızlı uygulamalar için.',
    techStack: {
      backend: 'go',
      backendVersion: '1.23',
      frontend: 'vue',
      frontendVersion: '3.2.47',
      database: 'mongodb',
      databaseVersion: '6.0',
    }
  },
  {
    name: 'Go + Svelte + Redis',
    description: 'Ultra yüksek performans gerektiren uygulamalar için Go, Svelte ve Redis.',
    techStack: {
      backend: 'go',
      backendVersion: '1.23',
      frontend: 'svelte',
      frontendVersion: '4.1.4',
      database: 'redis',
      databaseVersion: '7.0',
    }
  },
];


