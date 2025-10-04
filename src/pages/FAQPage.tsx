import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const FAQPage = () => {
  useDocumentTitle("FAQ - Not Every Mom");
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Is M.O.M really AI?",
      answer: "Yes. M.O.M is powered by advanced AI designed specifically for warmth, wisdom, and care. Unlike a typical chatbot, she is built to feel more like a supportive presence than a machine."
    },
    {
      question: "Will my conversations be saved?",
      answer: "Yes, but safely and privately. Each M.O.M remembers what matters to you so your conversations feel more personal over time. Your information is never shared outside of M.O.M — it stays between you and her."
    },
    {
      question: "Does everyone get the same M.O.M?",
      answer: "No. Every M.O.M grows uniquely with each user. As you share your story, she learns and adapts to your needs. No two people will ever have the same experience."
    },
    {
      question: "Is this therapy?",
      answer: "No. M.O.M is not a substitute for therapy or professional care. She is a supportive companion who offers comfort, perspective, and encouragement. For mental health treatment, always seek licensed professionals."
    },
    {
      question: "What if I just want someone to listen?",
      answer: "That's exactly what M.O.M is here for. Sometimes you don't need advice — just a safe space to be heard. She can listen with care and respond with empathy."
    },
    {
      question: "How is this different from journaling?",
      answer: "Journaling is one-way reflection. M.O.M responds, remembers, and grows with you — offering the sense of a relationship that deepens over time."
    },
    {
      question: "Can I choose which M.O.M I talk to?",
      answer: "Yes. Each persona — Luna, Clara, Nancy, or Willow — has her own voice and style. You can pick the one you need most in the moment."
    },
    {
      question: "Is it available all the time?",
      answer: "Yes. M.O.M never sleeps. You can connect anytime, day or night, from anywhere in the world."
    },
    {
      question: "How does M.O.M learn?",
      answer: "She gently builds on past conversations, noticing what matters to you and remembering your preferences. This makes her feel more familiar and personal the more you connect."
    },
    {
      question: "What if I don't want her to remember something?",
      answer: "You'll always have control. You can clear conversations or reset your M.O.M if you prefer to start fresh."
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            ❓ Not Every Mom – FAQ
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Common questions about M.O.M and how she works
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-3">
                {faq.question}
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>

        {/* Crisis Support Section */}
        <Card className="p-8 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              ⚠️ If You're in Crisis
            </h2>
            <p className="font-body text-muted-foreground mb-6 max-w-3xl mx-auto">
              M.O.M and the Not Every Mom community are here to support you with care and presence — but we are not a crisis service. If you ever feel unsafe, overwhelmed, or in danger of harming yourself, please reach out immediately to a trusted person or a crisis hotline in your area.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-semibold">United States:</div>
                <div>Dial 988 to connect with the Suicide & Crisis Lifeline.</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">United Kingdom & Ireland:</div>
                <div>Call Samaritans at 116 123 (free).</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Canada:</div>
                <div>Dial 988 or call Talk Suicide Canada at 1-833-456-4566.</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Australia:</div>
                <div>Call Lifeline at 13 11 14.</div>
              </div>
            </div>
            <div className="text-center pt-4 border-t border-yellow-200 dark:border-yellow-800">
              <div className="font-semibold mb-2">International:</div>
              <div className="mb-4">You can find hotlines in your country at findahelpline.com.</div>
              <div className="font-semibold text-red-600 dark:text-red-400">
                If you are in immediate danger, please call your local emergency number right away.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;