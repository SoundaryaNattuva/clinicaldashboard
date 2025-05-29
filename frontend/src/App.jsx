import '@cloudscape-design/global-styles/index.css'
import {React, useState} from 'react';
import { Routes, Route } from 'react-router-dom'

//CloudScape Components
import { AppLayout, ContentLayout, Header, SideNavigation } from '@cloudscape-design/components';
import { I18nProvider } from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.en';

//logo 
import logo from './assets/bms-logo.png'

//pages
import AllStudies from './pages/AllStudies.jsx';
import UploadFile from './pages/Upload.jsx';
import AddStudy from './pages/AddStudy.jsx';
import Dashboard from './pages/Dashboard.jsx';

const LOCALE = 'en';

export default function AppLayoutPreview() {
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <I18nProvider locale={LOCALE} messages={[messages]}>
      <AppLayout
        navigationOpen={isNavOpen}
        onNavigationChange={({ detail }) => setIsNavOpen(detail.open)}
        navigation={ 
          <SideNavigation
            header={{
              href: '/dashboard',
              logo: { alt: 'logo', src: logo }
            }}
            items={[
              {
                type: 'link',
                text: 'Dashboard',
                id: 'dashboard',
                href: '/dashboard', 
              },
              {
                type: 'link',
                text: 'Study Management',
                id: 'studies',
                href: '/studies',
              },
              {
                type: 'link',
                text: 'Upload File',
                id: 'upload',
                href: '/upload', 
              },
              {
                type: 'link',
                text: 'Add Study',
                id: 'addstudy',
                href: '/studies/create', 
              },
            ]}
          />
        }
        content={
          <ContentLayout header={<Header></Header>}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/studies" element={<AllStudies />} />
              <Route path="/upload" element={<UploadFile />} />
              <Route path="/studies/create" element={<AddStudy/>} />
              <Route path="*" element={<p>Page not found</p>} />
            </Routes>
          </ContentLayout>
        }
      />
    </I18nProvider>
  );
}
