import { Injectable } from '@nestjs/common';
import { DnsProviderClient } from '../interfaces/dns-provider.interface';

@Injectable()
export class MockDnsProviderClient implements DnsProviderClient {
    async createRecord(subdomain: string, ip: string): Promise<void> {
        // Gerçek domain edinilene kadar hiçbir şey yapmıyor — sahte başarı davranışı.
        // İleride CloudflareDnsProviderClient gibi gerçek bir implementasyon bu arayüzü dolduracak.
        return;
    }
}
