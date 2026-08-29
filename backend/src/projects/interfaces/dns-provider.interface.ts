export interface DnsProviderClient {
    createRecord(subdomain: string, ip: string): Promise<void>;
}
