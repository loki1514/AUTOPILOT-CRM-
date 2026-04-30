import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useBDTeam, CreateBDTeamMemberInput } from '@/hooks/useBDTeam';
import { Plus, Trash2, UsersRound, Mail, MapPin } from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi/Noida', 'Indore'];
const ROLES = [
  { value: 'bd', label: 'BD Team' },
  { value: 'city_head', label: 'City Head' },
  { value: 'leadership', label: 'Leadership' },
];

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'leadership':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'city_head':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function BDTeam() {
  const { team, isLoading, createMember, updateMember, deleteMember, getAllCities } = useBDTeam();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateBDTeamMemberInput>({
    member_name: '',
    member_email: '',
    city: '',
    role: 'bd',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMember.mutateAsync(formData);
    setIsOpen(false);
    setFormData({ member_name: '', member_email: '', city: '', role: 'bd' });
  };

  const groupedByCity = team.reduce((acc, member) => {
    if (!acc[member.city]) acc[member.city] = [];
    acc[member.city].push(member);
    return acc;
  }, {} as Record<string, typeof team>);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UsersRound className="h-6 w-6 text-primary" />
              BD Team
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your business development team members for daily intelligence distribution.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.member_name}
                    onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    value={formData.member_email}
                    onChange={(e) => setFormData({ ...formData, member_email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(v) => setFormData({ ...formData, city: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role || 'bd'}
                      onValueChange={(v) => setFormData({ ...formData, role: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMember.isPending}>
                    {createMember.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading team...</p>
        ) : team.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your BD team members to start sending daily intelligence briefs.
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(groupedByCity).map(([city, members]) => (
              <Card key={city}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {city}
                    <Badge variant="secondary" className="ml-auto">
                      {members.length} members
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.member_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{member.member_name}</span>
                            <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                              {ROLES.find(r => r.value === member.role)?.label || member.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.member_email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.is_active ?? true}
                          onCheckedChange={(v) => updateMember.mutate({ id: member.id, is_active: v })}
                          title={member.is_active ? 'Active' : 'Inactive'}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMember.mutate(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
