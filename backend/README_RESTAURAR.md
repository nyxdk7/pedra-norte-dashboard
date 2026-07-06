# Pedra Norte Dashboard - restauração do projeto

Este pacote reconstrói o projeto Django do dashboard de medições/contratos da Pedra Norte.

## 1. Criar a pasta do projeto

No PowerShell:

```powershell
cd C:\projetos
mkdir pedra-norte-dashboard
```

Extraia os arquivos deste ZIP dentro de:

```text
C:\projetos\pedra-norte-dashboard
```

A estrutura principal deve ficar assim:

```text
C:\projetos\pedra-norte-dashboard\manage.py
C:\projetos\pedra-norte-dashboard\config\settings.py
C:\projetos\pedra-norte-dashboard\dashboard\views.py
```

## 2. Criar e ativar o ambiente virtual

```powershell
cd C:\projetos\pedra-norte-dashboard
py -3.14 -m venv venv
.\venv\Scripts\Activate.ps1
```

Se o Windows bloquear o script do venv:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.\venv\Scripts\Activate.ps1
```

## 3. Instalar dependências

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Colocar a credencial do Google

Coloque o arquivo da conta de serviço neste caminho:

```text
credentials\google-service-account.json
```

O arquivo NÃO está incluso neste pacote por segurança.

A planilha precisa estar compartilhada com o e-mail da conta de serviço.

## 5. Criar banco e tabelas

```powershell
python manage.py makemigrations
python manage.py migrate
```

## 6. Criar usuário administrador

```powershell
python manage.py createsuperuser
```

## 7. Testar o sistema

```powershell
python manage.py check
python manage.py runserver
```

Acesse:

```text
http://127.0.0.1:8000/
```

## 8. Sincronizar os dados

Depois de logar, clique em:

```text
Sincronizar agora
```

Ou rode pelo PowerShell:

```powershell
python manage.py shell -c "from dashboard.services.importador_geral import sincronizar_tudo; print(sincronizar_tudo())"
```

## 9. Acesso pelo celular na mesma rede

Rode o servidor assim:

```powershell
python manage.py runserver 0.0.0.0:8000
```

Descubra o IP do notebook:

```powershell
ipconfig
```

No celular, acesse algo como:

```text
http://192.168.0.100:8000/
```

## Observações

- O banco SQLite (`db.sqlite3`) não está incluso.
- O arquivo JSON do Google não está incluso.
- O sistema está em modo desenvolvimento (`DEBUG=True`).
- Antes de colocar em produção, troque `SECRET_KEY`, ajuste `ALLOWED_HOSTS` e configure hospedagem adequada.
