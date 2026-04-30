import { useState, useEffect } from 'react';
import { useEmailContacts } from '@/hooks/useEmailContacts';
import { useBDTeam } from '@/hooks/useBDTeam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Search } from 'lucide-react';

interface AudienceSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function AudienceSelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
}: AudienceSelectorProps) {
  const { contacts, getEligibleContacts, isLoading: contactsLoading } = useEmailContacts();
  const { team, getAllCities, isLoading: teamLoading } = useBDTeam();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const eligibleContacts = getEligibleContacts();
  const allCities = getAllCities();

  // Filter contacts based on search and city selection
  const filteredContacts = eligibleContacts.filter(contact => {
    const matchesSearch = 
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCity = selectedCities.length === 0 || 
      (contact.city && selectedCities.includes(contact.city));

    return matchesSearch && matchesCity;
  });

  // Handle select all visible
  const handleSelectAll = () => {
    const allVisibleIds = filteredContacts.map(c => c.id);
    onSelectionChange(allVisibleIds);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  // Toggle single contact
  const toggleContact = (contactId: string) => {
    if (selectedIds.includes(contactId)) {
      onSelectionChange(selectedIds.filter(id => id !== contactId));
    } else {
      onSelectionChange([...selectedIds, contactId]);
    }
  };

  // Toggle city filter
  const toggleCityFilter = (city: string) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter(c => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  // Add all team members as contacts
  const addTeamAsRecipients = () => {
    const teamEmails = team.filter(m => m.is_active).map(m => m.member_email);
    const matchingContacts = eligibleContacts.filter(c => teamEmails.includes(c.email));
    const matchingIds = matchingContacts.map(c => c.id);
    onSelectionChange([...new Set([...selectedIds, ...matchingIds])]);
  };

  const isLoading = contactsLoading || teamLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Recipients
        </CardTitle>
        <CardDescription>
          Choose who will receive this campaign. Only subscribed, non-bounced contacts are shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>

          {/* City Filters */}
          {allCities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Filter by city:</span>
              {allCities.map(city => (
                <Badge
                  key={city}
                  variant={selectedCities.includes(city) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => !disabled && toggleCityFilter(city)}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {city}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <div className="text-sm">
            <span className="font-medium">{selectedIds.length}</span> of{' '}
            <span className="font-medium">{eligibleContacts.length}</span> contacts selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline"
              disabled={disabled}
            >
              Select visible ({filteredContacts.length})
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-sm text-muted-foreground hover:underline"
              disabled={disabled}
            >
              Clear
            </button>
            {team.length > 0 && (
              <>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={addTeamAsRecipients}
                  className="text-sm text-primary hover:underline"
                  disabled={disabled}
                >
                  Add BD Team
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contact List */}
        <ScrollArea className="h-[300px] rounded-md border">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {eligibleContacts.length === 0
                ? 'No eligible contacts. Add contacts to send campaigns.'
                : 'No contacts match your search criteria.'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer ${
                    selectedIds.includes(contact.id) ? 'bg-muted' : ''
                  }`}
                  onClick={() => !disabled && toggleContact(contact.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(contact.id)}
                    disabled={disabled}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {contact.name || contact.email}
                      </span>
                      {contact.city && (
                        <Badge variant="outline" className="text-xs">
                          {contact.city}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {contact.email}
                      {contact.company && ` • ${contact.company}`}
                    </div>
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="flex gap-1">
                      {contact.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
