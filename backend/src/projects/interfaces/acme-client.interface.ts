export interface AcmeClient {
    requestCertificate(domain: string): Promise<{ expiresAt: Date }>;
}
