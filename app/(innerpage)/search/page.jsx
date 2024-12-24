import CommunityList from "@/app/_components/Community";
import Search from "@/app/_components/Search";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Challenges from "../challenges/page";
import ActivitiesList from "../activities/page";

export default function MagicBox() {
  
  return (
    <div className="w-full mx-auto flex items-center">
      <Tabs defaultValue="magicbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="magicbox">Magic Box</TabsTrigger>
          <TabsTrigger value="contest">Contest</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="activity">Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="magicbox">
          <Search />
        </TabsContent>
        <TabsContent value="contest">
          <Challenges />
        </TabsContent>
        <TabsContent value="community">
          <CommunityList />
        </TabsContent>
        <TabsContent value="activity">
          <ActivitiesList />
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
