import { Injectable } from '@nestjs/common';
import { AcmeClient } from '../interfaces/acme-client.interface';

@Injectable()
export class MockAcmeClient implements AcmeClient {
    async requestCertificate(domain: string): Promise<{ expiresAt: Date }> {
        // Gerçek domain edinilene kadar sahte bir sertifika süresi döndürür.
        // İleride gerçek ACME (Let's Encrypt) implementasyonu bu arayüzü dolduracak.
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90); // Let's Encrypt sertifikaları genelde 90 gün geçerlidir
        return { expiresAt };
    }
}
