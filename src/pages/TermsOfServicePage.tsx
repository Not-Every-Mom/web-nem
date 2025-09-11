import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/settings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-6">
                  By accessing and using our service, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service.
                </p>

                <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
                <p className="mb-6">
                  Our service provides [description of your service]. We reserve the right to modify, 
                  suspend, or discontinue the service at any time without notice.
                </p>

                <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
                <p className="mb-4">
                  To access certain features of our service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Maintaining the confidentiality of your account information</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
                <p className="mb-4">
                  You agree not to use the service to:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Transmit harmful or malicious content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the service</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">5. Subscription and Billing</h2>
                <p className="mb-4">
                  Subscription fees are billed in advance on a recurring basis. You may cancel your 
                  subscription at any time. Cancellations take effect at the end of the current billing period.
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>All fees are non-refundable unless required by law</li>
                  <li>We reserve the right to change our pricing at any time</li>
                  <li>You will be notified of price changes in advance</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
                <p className="mb-6">
                  The service and its original content, features, and functionality are owned by us and are 
                  protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property laws.
                </p>

                <h2 className="text-xl font-semibold mb-4">7. Privacy</h2>
                <p className="mb-6">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs 
                  your use of the service, to understand our practices.
                </p>

                <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="mb-6">
                  In no event shall we be liable for any indirect, incidental, special, consequential, or 
                  punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses.
                </p>

                <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
                <p className="mb-6">
                  We may terminate or suspend your account and bar access to the service immediately, 
                  without prior notice or liability, under our sole discretion, for any reason whatsoever 
                  and without limitation.
                </p>

                <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
                <p className="mb-6">
                  We reserve the right to modify or replace these terms at any time. If a revision is 
                  material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>

                <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Email: legal@example.com</li>
                  <li>Address: [Your Company Address]</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;