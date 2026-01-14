import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "blue", trend }) {
  const colorClasses = {
    blue: "from-[#135670] to-[#1a7a9e]",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    orange: "from-[#ff5c00] to-orange-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-card group">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div className={`w-2 bg-gradient-to-b ${colorClasses[color]}`} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                  )}
                  {trend && (
                    <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className="font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
                      <span className="text-muted-foreground ml-1">vs mês anterior</span>
                    </div>
                  )}
                </div>
                {Icon && (
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}