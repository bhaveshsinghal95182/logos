"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Copy, Github, ArrowRight, Zap, Code, Package } from "lucide-react"
import { useState } from "react"

export default function CompanyLogosLanding() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string, command: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(command)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="min-h-screen">
        <header className="border-b border-gruvbox-gray/30 bg-white/5">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* ASCII Art Logo */}
            <div className="text-center mb-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                <pre className="ascii-art text-gruvbox-yellow-bright text-sm">
                  {`
 ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ███╗   ██╗██╗   ██╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║╚██╗ ██╔╝
██║     ██║   ██║██╔████╔██║██████╔╝███████║██╔██╗ ██║ ╚████╔╝ 
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║╚██╗██║  ╚██╔╝  
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║██║ ╚████║   ██║   
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   
`}
                </pre>
                <pre className="ascii-art text-white text-4xl font-bold">-</pre>
                <pre className="ascii-art text-gruvbox-green-bright text-sm">
                  {`
██╗      ██████╗  ██████╗  ██████╗ 
██║     ██╔═══██╗██╔════╝ ██╔═══██╗
██║     ██║   ██║██║  ███╗██║   ██║
██║     ██║   ██║██║   ██║██║   ██║
███████╗╚██████╔╝╚██████╔╝╚██████╔╝
╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ 
`}
                </pre>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center justify-center gap-8">
              <a
                href="#installation"
                className="text-gruvbox-fg-soft hover:text-gruvbox-yellow-bright transition-colors font-mono text-sm"
              >
                installation
              </a>
              <a
                href="#usage"
                className="text-gruvbox-fg-soft hover:text-gruvbox-yellow-bright transition-colors font-mono text-sm"
              >
                usage
              </a>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white/10 border-gruvbox-gray text-gruvbox-muted-foreground hover:bg-gruvbox-primary hover:text-gruvbox-bg font-mono"
              >
                <Github className="w-4 h-4" />
                github
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-gruvbox-yellow border-gruvbox-gray font-mono">
              cli tool for react developers
            </Badge>
            <div className="mb-8">
              <div className="bg-black/50 border border-gruvbox-gray rounded-lg p-6 font-mono text-left max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gruvbox-fg-soft text-sm ml-2">terminal</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-gruvbox-green-bright">➜ project git:(main) ✗ pnpx company-logos@latest</div>
                  <div className="text-gruvbox-fg-soft">📁 Working in: /home/user/project</div>
                  <div className="text-gruvbox-yellow-bright">📦 Company Logos CLI</div>
                  <div className="mt-3"></div>
                  <div className="text-gruvbox-blue-bright">🔧 Commands:</div>
                  <div className="text-gruvbox-fg ml-3">add: {"<name...>"} Add logo component(s)</div>
                  <div className="text-gruvbox-fg ml-3">list: List logos in project</div>
                  <div className="text-gruvbox-fg ml-3">available: List available components</div>
                  <div className="text-gruvbox-fg ml-3">categories: List component categories</div>
                  <div className="mt-2"></div>
                  <div className="text-gruvbox-blue-bright">⚡ Flags:</div>
                  <div className="text-gruvbox-fg ml-3">--tsx: Create TypeScript components</div>
                  <div className="text-gruvbox-fg ml-3">--jsx: Create JavaScript components</div>
                  <div className="text-gruvbox-fg ml-3">--force, -f: Overwrite existing files</div>
                  <div className="text-gruvbox-fg ml-3">--all, -a: Add all available components</div>
                  <div className="text-gruvbox-fg ml-3">--category, -c: Filter by category</div>
                  <div className="text-gruvbox-fg ml-3">--search, -s: Search components</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "npx", command: "npx company-logos@latest" },
                { label: "pnpm", command: "pnpm dlx company-logos@latest" },
                { label: "bunx", command: "bunx company-logos@latest" },
              ].map(({ label, command }) => (
                <Card key={label} className="p-4 bg-white/10 border-gruvbox-gray">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gruvbox-blue-bright" />
                        <code className="text-sm font-mono text-white">{command}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(command, label)}
                        className="h-8 w-8 p-0 text-white hover:bg-gruvbox-yellow hover:text-gruvbox-bg"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {copiedCommand === label && (
                      <p className="text-xs text-gruvbox-green-bright mt-1 font-mono">copied!</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-gruvbox-yellow text-gruvbox-bg hover:bg-gruvbox-yellow-bright font-mono"
              >
                get started
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 bg-white/10 border-gruvbox-gray text-white hover:bg-gruvbox-blue hover:text-gruvbox-bg font-mono"
              >
                <Code className="w-4 h-4" />
                view examples
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">why choose company-logos?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto font-mono">
                streamline your development workflow with automated logo component generation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 bg-white/10 border-gruvbox-gray">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gruvbox-yellow/20 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-gruvbox-yellow-bright" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white font-mono">lightning fast</h3>
                  <p className="text-gray-300">generate react components in seconds with our optimized cli tool</p>
                </CardContent>
              </Card>

              <Card className="p-6 bg-white/10 border-gruvbox-gray">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gruvbox-blue/20 rounded-lg flex items-center justify-center mb-4">
                    <Code className="w-6 h-6 text-gruvbox-blue-bright" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white font-mono">typescript ready</h3>
                  <p className="text-gray-300">supports both jsx and tsx output with full typescript compatibility</p>
                </CardContent>
              </Card>

              <Card className="p-6 bg-white/10 border-gruvbox-gray">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gruvbox-green/20 rounded-lg flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-gruvbox-green-bright" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white font-mono">svgl powered</h3>
                  <p className="text-gray-300">built on top of the reliable svgl api with thousands of company logos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section id="usage" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">see it in action</h2>
              <p className="text-gray-300 font-mono">from command line to react component in one simple step</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Input */}
              <Card className="p-6 bg-white/10 border-gruvbox-gray">
                <CardContent className="p-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white font-mono">
                    <Terminal className="w-5 h-5" />
                    command
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <span className="text-gruvbox-green-bright">$</span>{" "}
                    <span className="text-white">company-logos add vercel --tsx</span>
                  </div>
                </CardContent>
              </Card>

              {/* Output */}
              <Card className="p-6 bg-white/10 border-gruvbox-gray">
                <CardContent className="p-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white font-mono">
                    <Code className="w-5 h-5" />
                    generated component
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300">{`import React from 'react';

export const VercelLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 19.777h20L12 2z" />
  </svg>
);`}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-white font-mono">🌟 examples</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-black/50 rounded p-3 font-mono text-sm">
                    <span className="text-gruvbox-green-bright">$</span>{" "}
                    <span className="text-white">company-logos add discord --jsx</span>
                  </div>
                  <div className="bg-black/50 rounded p-3 font-mono text-sm">
                    <span className="text-gruvbox-green-bright">$</span>{" "}
                    <span className="text-white">company-logos add --category framework --tsx</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/50 rounded p-3 font-mono text-sm">
                    <span className="text-gruvbox-green-bright">$</span>{" "}
                    <span className="text-white">company-logos add --search react --jsx</span>
                  </div>
                  <div className="bg-black/50 rounded p-3 font-mono text-sm">
                    <span className="text-gruvbox-green-bright">$</span>{" "}
                    <span className="text-white">company-logos available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gruvbox-gray/30 py-8 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gruvbox-yellow/20 rounded flex items-center justify-center">
                <Package className="w-4 h-4 text-gruvbox-yellow-bright" />
              </div>
              <span className="text-gray-300 font-mono">company-logos</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-gray-300 hover:text-gruvbox-yellow-bright transition-colors font-mono text-sm"
              >
                documentation
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-gruvbox-yellow-bright transition-colors font-mono text-sm"
              >
                github
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-gruvbox-yellow-bright transition-colors font-mono text-sm"
              >
                issues
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
