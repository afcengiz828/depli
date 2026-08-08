import {PostgreSqlContainer, StartedPostgreSqlContainer} from "@testcontainers/postgresql";
import {DataSource} from "typeorm";
import {ProjectEntity} from "./project.entity";
import {User} from "../../users/entities/user.entity";
import {ProjectStatus} from "../enums/project-status.enum";

describe("Project Entity (Integration)", () => {

    let container: StartedPostgreSqlContainer;
    let dataSource: DataSource;

    // Veri tabanı bağlantısına ihtiyaç duyduğumuz için test öncesinde PostgreSQL konteynerini ve TypeORM DataSource'u başlatıyoruz.
    beforeAll(async () => {
        container = await new PostgreSqlContainer('postgres:16-alpine').start();

        dataSource = new DataSource({
            type: 'postgres',
            host: container.getHost(),
            port: container.getPort(),
            username: container.getUsername(),
            password: container.getPassword(),
            database: container.getDatabase(),
            entities: [ProjectEntity, User],
            synchronize: true,
        });

        await dataSource.initialize();
    }, 30000);

    // testler tamamlandıktan sonra veri tabanı bağlantısını kapatıyoruz ve konteyneri durduruyoruz.

    afterAll(async () => {
// Foreign Key ilişkisinden dolayı önce bağımlı çocuk tabloyu (projects) siliyoruz
    await dataSource.query('DELETE FROM "projects";');
    // Ardından ebeveyn tabloyu (users) siliyoruz
    await dataSource.query('DELETE FROM "users";');
    await dataSource.destroy();
    await container.stop();    
    
    });

    beforeEach(async () => {
    // TypeORM QueryBuilder kullanarak DELETE FROM işlemi yapıyoruz.
    // Bu yöntem hem 'boş kriter' hatasına takılmaz hem de TRUNCATE kullanmadığı için 
    // Foreign Key (yabancı anahtar) kısıtlamalarına takılmadan tabloları temizler.
    
    // 1. Önce bağımlı çocuk tabloyu (Project) temizliyoruz
    await dataSource.getRepository(ProjectEntity)
      .createQueryBuilder()
      .delete()
      .execute();

    // 2. Ardından ebeveyn tabloyu (User) temizliyoruz
    await dataSource.getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();
  });

    // Test 1: Projeler tablosunun doğru kolonlara ve tiplerine sahip olduğunu doğrulamak için bir test yazıyoruz.
    it("should create projects table with correct columns and types", async () => {
        // TypeORM'un QueryRunner'ını kullanarak tabloyu ve kolonları kontrol ediyoruz.
        const queryRunner = dataSource.createQueryRunner();
        const table = await queryRunner.getTable("projects");

        // Tablo var mı?
        expect(table).toBeDefined();
        // ID kolonu var mı ve doğru tipte mi?
        expect(table?.findColumnByName("id")?.type).toBe("uuid");
        // Name kolonu var mı ve doğru tipte mi?
        expect(table?.findColumnByName("name")?.type).toBe("character varying");
        // Status kolonu var mı ve doğru tipte mi?
        expect(table?.findColumnByName("status")?.type).toBe("enum");
        // createdAt kolonu var mı ve doğru tipte mi?
        expect(table?.findColumnByName("createdAt")?.type).toBe("timestamp with time zone");
        // updatedAt kolonu var mı ve doğru tipte mi?
        expect(table?.findColumnByName("updatedAt")?.type).toBe("timestamp with time zone");
    });

    // Test 2: Başarılı bir şekilde proje kaydı oluşturma ve varsayılan status değerini doğrulama
  it('should create a project with default status provisioning', async () => {
    // Test için bir mock kullanıcı oluşturuyoruz
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.save(
      userRepo.create({
        email: 'test@example.com',
        password: 'securepassword123',
      }),
    );

    // Test için proje nesnesi hazırlıyoruz
    const projectRepo = dataSource.getRepository(ProjectEntity);
    const project = projectRepo.create({
      name: 'My Dockerized Backend',
      githubUrl: 'https://github.com/user/repo',
      techStack: { backend: 'nestjs', database: 'postgres', version: '18' },
      user: user,
    });

    // Projeyi veritabanına kaydediyoruz
    const savedProject = await projectRepo.save(project);

    // Oluşan ID'nin uuid formatında atandığını doğruluyoruz
    expect(savedProject.id).toBeDefined();
    // Proje adını doğruluyoruz
    expect(savedProject.name).toBe('My Dockerized Backend');
    // Varsayılan status değerinin 'provisioning' olduğunu doğruluyoruz
    expect(savedProject.status).toBe(ProjectStatus.PROVISIONING);
    // JSONB alanının obje olarak başarıyla kaydedildiğini doğruluyoruz
    expect(savedProject.techStack.backend).toBe('nestjs');
    // İlişkilendirilen kullanıcının ID'sinin doğru atandığını doğruluyoruz
    expect(savedProject.userId).toBe(user.id);
  });

// Test 3: Kullanıcı (User) ile Proje (Project) arasındaki 1-N ilişkisini doğrulama
  it('should support OneToMany relationship between User and Project', async () => {
    // Kullanıcı reposunu alıp yeni kullanıcı kaydediyoruz
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.save(
      userRepo.create({
        email: 'developer@example.com',
        password: 'password123',
      }),
    );

    // Bu kullanıcıya 2 adet farklı proje tanımlıyoruz
    const projectRepo = dataSource.getRepository(ProjectEntity);
    await projectRepo.save([
      projectRepo.create({ name: 'Project Alpha', techStack: {}, user }),
      projectRepo.create({ name: 'Project Beta', techStack: {}, user }),
    ]);

    // Kullanıcıyı ilişkili projeleriyle (relations) veritabanından çekiyoruz
    const userWithProjects = await userRepo.findOne({
      where: { id: user.id },
      relations: {  projects: true },
    });

    // Kullanıcının 2 projesi olduğunu ve isimlerinin eşleştiğini doğruluyoruz
    expect(userWithProjects?.projects).toHaveLength(2);
    expect(userWithProjects?.projects.map((p) => p.name)).toContain('Project Alpha');
    expect(userWithProjects?.projects.map((p) => p.name)).toContain('Project Beta');
  });

  // Test 4: Geçersiz bir status enum değeri verildiğinde veritabanının hata fırlatması
  it('should reject invalid status enum values', async () => {
    // Önce geçerli bir kullanıcı oluşturuyoruz
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.save(
      userRepo.create({ email: 'enumtest@example.com', password: 'pass' }),
    );

    // Ham SQL sorgusu ile 'invalid_status' değerini enuma basmaya çalışıyoruz
    const queryRunner = dataSource.createQueryRunner();

    // SQL SEVİYESİNDE HATA ALMAYI BEKLİYORUZ
    await expect(
      queryRunner.query(
        `INSERT INTO "projects" ("name", "status", "techStack", "userId") VALUES ($1, $2, $3, $4)`,
        ['Invalid Project', 'invalid_status', '{}', user.id],
      ),
    ).rejects.toThrow();

    // QueryRunner'ı kapatıyoruz
    await queryRunner.release();
  });

  // Test 5: Var olmayan bir userId (Foreign Key) ile proje oluşturulamaması
  it('should fail when assigning project to non-existent userId', async () => {
    // Proje reposunu alıyoruz
    const projectRepo = dataSource.getRepository(ProjectEntity);
    // Rastgele var olmayan bir UUID oluşturuyoruz
    const fakeUserId = '00000000-0000-0000-0000-000000000000';

    // Var olmayan userId ile projeyi DB'ye yazmayı deniyoruz
    const invalidProject = projectRepo.create({
      name: 'Orphan Project',
      techStack: {},
      userId: fakeUserId,
    });

    // Foreign Key ihlali sebebiyle veritabanının işlemeyi reddetmesini bekliyoruz
    await expect(projectRepo.save(invalidProject)).rejects.toThrow();
  }); 


  
});