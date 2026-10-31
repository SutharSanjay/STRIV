import { render, screen } from '@testing-library/react-native';

jest.mock('../../src/database/client/database', () => ({
  openAndMigrate: jest.fn(() => Promise.resolve()),
  getExecutor: jest.fn(),
}));

jest.mock('../../src/features/backup/data/backup', () => ({
  getLastBackupAt: jest.fn(async () => null),
}));

jest.mock('../../src/features/analytics/data/streak', () => ({
  loadTrainingPulse: jest.fn(async () => ({
    streak: 0,
    message: 'Finish a session and the streak starts at one.',
  })),
}));

jest.mock('../../src/features/workouts/data/sessions', () => ({
  loadToday: jest.fn(async () => ({
    inProgressSessionId: null,
    activeSplit: null,
    day: null,
  })),
}));

import App from '../../src/app/App';

describe('App', () => {
  it('shows the home empty state after the database opens', async () => {
    await render(<App />);

    expect(
      await screen.findByText(
        'Choose a program to start training.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Train with intent. Progress with purpose.')).toBeTruthy();
  });
});
