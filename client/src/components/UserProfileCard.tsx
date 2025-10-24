import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Briefcase, Settings } from "lucide-react";

interface UserProfileCardProps {
  title: string;
  description: string;
  iconType: 'owner' | 'client' | 'broker' | 'manager';
  index: number;
}

const iconMap = {
  owner: Building2,
  client: Users,
  broker: Briefcase,
  manager: Settings,
};

export default function UserProfileCard({ title, description, iconType, index }: UserProfileCardProps) {
  const Icon = iconMap[iconType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card 
        className="text-center hover-elevate transition-all duration-300 h-full"
        data-testid={`card-profile-${iconType}`}
      >
        <CardContent className="p-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Icon className="h-10 w-10 text-primary" />
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-3" data-testid={`text-title-${iconType}`}>
            {title}
          </h3>
          
          <p className="text-muted-foreground" data-testid={`text-description-${iconType}`}>
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
