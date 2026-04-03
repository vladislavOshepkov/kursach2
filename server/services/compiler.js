import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import os from 'os';

const execAsync = util.promisify(exec);

function getUniqueTempDir() {
  const dir = path.join(os.tmpdir(), `dotnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const LANGUAGE_CONFIGS = {
  javascript: {
    run: (filename) => `node ${filename}`,
    ext: 'js',
  },
  python: {
    run: (filename) => `python3 ${filename}`,
    ext: 'py',
  },
  csharp: {
    run: (filename) => `dotnet run --project .`,
    ext: 'cs',
  },
};

export const compileCode = async (code, language) => {
  const config = LANGUAGE_CONFIGS[language];
  if (!config) {
    return { error: `Язык не поддерживается: ${language}` };
  }

  let tempFile, workDir;

  try {
    const filename = `Program.${config.ext}`;

    if (language === 'csharp') {
      workDir = getUniqueTempDir();
      tempFile = path.join(workDir, filename);

      await execAsync(`dotnet new console -o "${workDir}" --force`, { timeout: 10000 });
      await fs.promises.writeFile(tempFile, code);
    } else {
      const tmpDir = os.tmpdir();
      tempFile = path.join(tmpDir, `code_${Date.now()}.${config.ext}`);
      await fs.promises.writeFile(tempFile, code);
    }

    // ✅ Убрали `timeout` из команды
    const runCommand = config.run(filename);

    // ⏱️ Вместо этого — используем timeout в exec
    const result = await execAsync(runCommand, {
      cwd: workDir || path.dirname(tempFile),
      timeout: 5000, // ⏱️ Ограничение времени здесь!
      maxBuffer: 1024 * 1024, // 1MB — защита от переполнения
      env: { ...process.env }
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      success: true,
    };
  } catch (err) {
    if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
      return { error: 'Превышено время выполнения (5 сек)' };
    }
    return {
      error: err.stderr || err.stdout || err.message,
      success: false,
    };
  } finally {
    if (workDir && fs.existsSync(workDir)) {
      try {
        await fs.promises.rm(workDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Не удалось удалить временную папку:', workDir);
      }
    }
    if (tempFile && !workDir && fs.existsSync(tempFile)) {
      try {
        await fs.promises.unlink(tempFile);
      } catch (e) {
        console.warn('Не удалось удалить временный файл:', tempFile);
      }
    }
  }
};