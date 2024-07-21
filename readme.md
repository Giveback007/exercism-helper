# Exercism Helper (aka) `exer`

> **Note:** This project has only been tested to work in a Linux environment (Ubuntu & Termux).

## Installing
1. Install the official [Exercism CLI](https://exercism.org/docs/using/solving-exercises/working-locally)
2. Add the [token](https://exercism.org/docs/using/solving-exercises/working-locally#h-configuration) to the Exercism CLI config
3. Install `Nodejs` and `npm`
4. Clone this project with git:
```shell
git clone https://github.com/Giveback007/exercism-helper.git
```

## Project Prep
1. cd into 'exercism-helper' directory (this project)
```shell
cd exercism-helper
```
2. Install dependencies with `npm` or `pnpm`:
```shell
pnpm install
```
3. Make the project executable:
```shell
chmod +x bin/exer
```
4. Make the bin folder accessible anywhere by adding this folder's bin to your .bashrc (or your shell equivalent .zshrc for zsh):
Open the file for editing:
```shell
nano ~/.bashrc
```
Then add this line to .bashrc (or .zshrc for zsh), and save:
```bash
export PATH=$PATH:~/exercism-helper/bin
```
> Make sure to edit the path (instead of "~/exercism-helper/bin") if the project is not in your home directory.
5. Restart your terminal or run `source ~/.bashrc` (or `source ~/.zshrc` for zsh) to apply the changes
6. Run the script anywhere in the terminal with:
```shell
exer
```
