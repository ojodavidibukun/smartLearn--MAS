// SmartLearn MAS - Agent System Explorer
// Clean, organized interface for understanding agent architecture

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAgents } from '@/data/mockData';
import { ArrowRight, Zap } from 'lucide-react';
import { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';

const agentColors: Record<string, { bg: string; text: string; border: string }> = {
  AGENT001: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  AGENT002: { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
  AGENT003: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
  AGENT004: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  AGENT005: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  AGENT006: { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200' },
};

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState(mockAgents[0]);

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">How SmartLearn Works</h1>
          <p className="text-muted-foreground">
            Discover the specialized agents that power your personalized learning experience
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent List - Left Column */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Agents
            </h2>
            <div className="space-y-2">
              {mockAgents.map((agent) => {
                const colors = agentColors[agent.id];
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs opacity-70 mt-1">{agent.purpose.substring(0, 40)}...</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Details - Right Column */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Agent Header */}
              <div className="mb-8 pb-6 border-b border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedAgent.name}</h2>
                    <p className="text-muted-foreground">{selectedAgent.purpose}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${agentColors[selectedAgent.id].bg}`} />
                </div>
              </div>

              {/* Tabs for Organization */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Inputs */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full" />
                      What It Receives
                    </h3>
                    <div className="space-y-2">
                      {selectedAgent.inputs.map((input, idx) => (
                        <div key={idx} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm text-foreground">{input}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-accent rounded-full" />
                      What It Produces
                    </h3>
                    <div className="space-y-2">
                      {selectedAgent.outputs.map((output, idx) => (
                        <div key={idx} className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                          <p className="text-sm text-foreground">{output}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections" className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Works With</h3>
                    {selectedAgent.relatedAgents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAgent.relatedAgents.map((relatedId) => {
                          const relatedAgent = mockAgents.find((a) => a.id === relatedId);
                          const colors = agentColors[relatedId];
                          return (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedAgent(relatedAgent!)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${colors.bg} ${colors.border} hover:shadow-md`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{relatedAgent?.name}</p>
                                  <p className="text-xs opacity-70 mt-1">{relatedAgent?.purpose.substring(0, 50)}...</p>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This agent works independently</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">How Agents Collaborate</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Each agent has a specific role in your learning journey. They work together to understand your needs, deliver personalized content, monitor your progress, and provide helpful guidance.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Your profile and preferences are managed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Content is personalized for your learning style</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Your progress is continuously monitored</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Recommendations are provided to help you succeed</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">For Educators</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Instructors get comprehensive insights into class performance and student engagement, enabling data-driven decisions to support student success.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Real-time class analytics and trends</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Early identification of students needing support</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Engagement and completion metrics</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Automated monitoring and reporting</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
