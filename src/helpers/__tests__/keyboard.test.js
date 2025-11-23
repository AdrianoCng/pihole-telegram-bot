import { getMainMenu } from '../keyboard.js';
import { Markup } from 'telegraf';

jest.mock('telegraf', () => ({
  Markup: {
    keyboard: jest.fn().mockReturnValue({ resize: jest.fn() }),
  },
}));

jest.mock('../../constants/commands.js', () => ({
  COMMANDS: [
    { trigger: 'simple' },
    { trigger: ['array', 'alias'] },
    { trigger: 'hidden', showInKeyboard: false },
    { trigger: 'visible', showInKeyboard: true },
  ],
}));

describe('keyboard helper', () => {
  it('should generate main menu keyboard correctly', () => {
    getMainMenu();

    expect(Markup.keyboard).toHaveBeenCalledWith(
      ['/simple', '/array', '/visible'],
      { columns: expect.any(Number) }
    );
  });
});

