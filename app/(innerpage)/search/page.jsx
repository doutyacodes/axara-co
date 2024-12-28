import CommunityList from "@/app/_components/Community";
import LeaderChallenges from "@/app/_components/LeaderChallenges";
import Search from "@/app/_components/Search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivitiesList from "../activities/page";
import Challenges from "../challenges/page";

export default function MagicBox() {
  
  return (
    <div className="w-full mx-auto flex items-center">
      <Tabs defaultValue="magicbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="magicbox">Search</TabsTrigger>
          <TabsTrigger value="leader">Leaderboard</TabsTrigger>
          <TabsTrigger value="contest">Contest</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="activity">Activities</TabsTrigger>
          
        </TabsList>
        <TabsContent value="magicbox">
          <Search />
        </TabsContent>
        <TabsContent value="leader">
          <LeaderChallenges />
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
